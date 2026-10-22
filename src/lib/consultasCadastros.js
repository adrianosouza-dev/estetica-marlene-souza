import { erroAmigavel } from './erros'
import { supabase } from './supabase'

/*
 * Consultas das telas de cadastro do painel: serviços, horários, folgas,
 * fotos, avaliações e perfil. Só funcionam com a profissional logada
 * (Row Level Security no banco).
 */

const BUCKET = 'galeria'

function cliente() {
  if (!supabase) throw erroAmigavel('O site ainda não está conectado ao banco de dados.')
  return supabase
}

async function executar(consulta) {
  const { data, error } = await consulta
  if (error) throw error
  return data
}

/** Confere que o banco alterou alguma linha (sem permissão, ele não dá erro, só não altera) */
function exigirAlteracao(linhas) {
  if (!linhas?.length) throw erroAmigavel('Não foi possível salvar. Entre de novo no painel.')
  return linhas
}

// ============================================================================
// Serviços
// ============================================================================

/** Todos os serviços, com "usado": já tem algum agendamento (então não pode ser removido) */
export async function buscarServicosAdmin() {
  const servicos = await executar(
    cliente().from('servicos').select('id, nome, descricao, duracao_minutos, preco, ativo, ordem').order('ordem').order('nome'),
  )
  const usados = await Promise.all(
    servicos.map((s) =>
      cliente()
        .from('agendamentos')
        .select('id', { count: 'exact', head: true })
        .eq('servico_id', s.id)
        .then(({ count, error }) => {
          if (error) throw error
          return count > 0
        }),
    ),
  )
  return servicos.map((s, i) => ({ ...s, usado: usados[i] }))
}

/** Cria (sem id) ou atualiza (com id) um serviço */
export async function salvarServico({ id, nome, descricao, duracao_minutos, preco, ativo, ordem }) {
  const campos = { nome: nome.trim(), descricao: descricao?.trim() || null, duracao_minutos, preco, ativo }
  if (id) {
    return exigirAlteracao(await executar(cliente().from('servicos').update(campos).eq('id', id).select('id')))
  }
  return executar(cliente().from('servicos').insert({ ...campos, ordem }).select('id'))
}

/**
 * Remove um serviço que nunca foi agendado.
 * O banco recusa (erro 23503) se houver agendamento ligado a ele.
 */
export async function removerServico(id) {
  const { data, error } = await cliente().from('servicos').delete().eq('id', id).select('id')
  if (error?.code === '23503') {
    throw erroAmigavel('Este serviço já tem agendamentos e não pode ser removido. Desative-o para tirar do site.')
  }
  if (error) throw error
  exigirAlteracao(data)
}

/** Troca a posição de dois itens (serviços ou fotos) na ordem do site */
export async function trocarOrdem(tabela, a, b) {
  // Se as posições forem iguais (ex.: itens novos), separa antes de trocar
  const ordemA = a.ordem === b.ordem ? b.ordem + 1 : a.ordem
  await Promise.all([
    executar(cliente().from(tabela).update({ ordem: b.ordem }).eq('id', a.id).select('id')).then(exigirAlteracao),
    executar(cliente().from(tabela).update({ ordem: ordemA }).eq('id', b.id).select('id')).then(exigirAlteracao),
  ])
}

// ============================================================================
// Horários, regras e folgas
// ============================================================================

export function buscarHorariosAdmin() {
  return executar(cliente().from('horarios_funcionamento').select('*').order('dia_semana'))
}

/** Salva um ou mais dias da semana (linhas completas de horarios_funcionamento) */
export async function salvarHorarios(dias) {
  return exigirAlteracao(await executar(cliente().from('horarios_funcionamento').upsert(dias).select('dia_semana')))
}

export function buscarPerfilAdmin() {
  return executar(cliente().from('perfil').select('*').eq('id', 1).single())
}

/** Atualiza campos do perfil (texto do Sobre, contato, regras do agendamento) */
export async function salvarPerfil(campos) {
  return exigirAlteracao(await executar(cliente().from('perfil').update(campos).eq('id', 1).select('id')))
}

/** Folgas e feriados que ainda não terminaram */
export function buscarBloqueiosFuturos(agoraTs) {
  return executar(cliente().from('bloqueios').select('id, inicio, fim, motivo').gt('fim', agoraTs).order('inicio'))
}

export async function criarBloqueio({ inicio, fim, motivo }) {
  return executar(cliente().from('bloqueios').insert({ inicio, fim, motivo: motivo?.trim() || null }).select('id'))
}

export async function removerBloqueio(id) {
  exigirAlteracao(await executar(cliente().from('bloqueios').delete().eq('id', id).select('id')))
}

/** Quantos agendamentos (não cancelados) cruzam um período: para avisar ao criar uma folga */
export async function contarAgendamentosNoPeriodo({ inicio, fim }) {
  const { count, error } = await cliente()
    .from('agendamentos')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'cancelado')
    .lt('inicio', fim)
    .gt('fim', inicio)
  if (error) throw error
  return count
}

// ============================================================================
// Fotos (Storage + tabela fotos)
// ============================================================================

const nomeUnico = (pasta, extensao) =>
  `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`

async function enviarArquivo(pasta, { blob, tipo, extensao }) {
  const caminho = nomeUnico(pasta, extensao)
  const { error } = await cliente().storage.from(BUCKET).upload(caminho, blob, { contentType: tipo, upsert: false })
  if (error) throw error
  const { data } = cliente().storage.from(BUCKET).getPublicUrl(caminho)
  return { caminho, url: data.publicUrl }
}

/**
 * Apaga um arquivo do Storage, com uma proteção por tipo:
 *   - 'galeria': qualquer foto de trabalho, mas NUNCA um arquivo da pasta perfil/
 *     (as fotos iniciais ficam na raiz do bucket; as enviadas pelo painel, em trabalhos/);
 *   - 'perfil': só arquivos da pasta perfil/.
 * Assim um caminho errado nunca apaga a foto da Marlene pela tela da galeria, e vice-versa.
 */
async function apagarArquivo(caminho, tipo) {
  if (!caminho) return
  const ehDoPerfil = caminho.startsWith('perfil/')
  if (tipo === 'galeria' && ehDoPerfil) return
  if (tipo === 'perfil' && !ehDoPerfil) return
  const { error } = await cliente().storage.from(BUCKET).remove([caminho])
  if (error) console.warn('Arquivo não apagado do Storage:', caminho, error) // a foto já saiu do site
}

export function buscarFotosAdmin() {
  return executar(cliente().from('fotos').select('id, url, legenda, ordem, caminho_storage, criado_em').order('ordem').order('criado_em', { ascending: false }))
}

/** Envia a foto já preparada (imagens.js) e cadastra no início da galeria */
export async function enviarFoto(foto, legenda, menorOrdem) {
  const { caminho, url } = await enviarArquivo('trabalhos', foto)
  try {
    return await executar(
      cliente()
        .from('fotos')
        .insert({ url, caminho_storage: caminho, legenda: legenda?.trim() || null, ordem: (menorOrdem ?? 1) - 1 })
        .select('id'),
    )
  } catch (erro) {
    await apagarArquivo(caminho, 'galeria') // não deixa arquivo solto se o cadastro falhar
    throw erro
  }
}

export async function salvarLegenda(id, legenda) {
  exigirAlteracao(await executar(cliente().from('fotos').update({ legenda: legenda?.trim() || null }).eq('id', id).select('id')))
}

/** Tira a foto do site e apaga o arquivo (nunca um arquivo da pasta perfil/) */
export async function removerFoto(foto) {
  exigirAlteracao(await executar(cliente().from('fotos').delete().eq('id', foto.id).select('id')))
  await apagarArquivo(foto.caminho_storage, 'galeria')
}

/**
 * Troca a foto do Sobre: envia a nova, atualiza o perfil e só então apaga a antiga.
 * Se algo falhar no meio, a foto antiga continua valendo.
 */
export async function trocarFotoPerfil(foto, caminhoAntigo) {
  const { caminho, url } = await enviarArquivo('perfil', foto)
  try {
    await salvarPerfil({ foto_url: url, foto_caminho_storage: caminho })
  } catch (erro) {
    await apagarArquivo(caminho, 'perfil')
    throw erro
  }
  if (caminhoAntigo && caminhoAntigo !== caminho) await apagarArquivo(caminhoAntigo, 'perfil')
  return url
}

// ============================================================================
// Avaliações
// ============================================================================

export function buscarAvaliacoesAdmin() {
  return executar(cliente().from('avaliacoes').select('id, nome, nota, comentario, status, criado_em').order('criado_em', { ascending: false }))
}

export async function aprovarAvaliacao(id) {
  exigirAlteracao(await executar(cliente().from('avaliacoes').update({ status: 'aprovada' }).eq('id', id).select('id')))
}

export async function removerAvaliacao(id) {
  exigirAlteracao(await executar(cliente().from('avaliacoes').delete().eq('id', id).select('id')))
}

// ============================================================================
// Perguntas frequentes
// ============================================================================

export function buscarPerguntasAdmin() {
  return executar(
    cliente().from('perguntas_frequentes').select('id, pergunta, resposta, ordem, ativa').order('ordem').order('criado_em'),
  )
}

/** Cria (sem id) ou atualiza (com id) uma pergunta */
export async function salvarPergunta({ id, pergunta, resposta, ativa, ordem }) {
  const campos = { pergunta: pergunta.trim(), resposta: resposta.trim(), ativa }
  if (id) {
    return exigirAlteracao(await executar(cliente().from('perguntas_frequentes').update(campos).eq('id', id).select('id')))
  }
  return executar(cliente().from('perguntas_frequentes').insert({ ...campos, ordem }).select('id'))
}

export async function removerPergunta(id) {
  exigirAlteracao(await executar(cliente().from('perguntas_frequentes').delete().eq('id', id).select('id')))
}

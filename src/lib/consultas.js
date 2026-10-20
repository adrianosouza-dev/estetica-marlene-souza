import { supabase } from './supabase'

/*
 * Consultas da parte pública do site.
 * Os filtros (só ativos, só aprovadas) também estão aqui, e não só nas regras do
 * banco: quando a profissional estiver logada, o banco libera tudo para ela, mas
 * o site público deve continuar mostrando só o que é público.
 */

function cliente() {
  if (!supabase) throw new Error('O site ainda não está conectado ao banco de dados.')
  return supabase
}

/** Executa a consulta e devolve os dados, ou lança o erro do Supabase */
async function executar(consulta) {
  const { data, error } = await consulta
  if (error) throw error
  return data
}

export function buscarServicosAtivos() {
  return executar(
    cliente()
      .from('servicos')
      .select('id, nome, descricao, duracao_minutos, preco')
      .eq('ativo', true)
      .order('ordem')
      .order('nome'),
  )
}

/** Fotos da galeria, das mais recentes para as mais antigas */
export function buscarFotos(limite) {
  let consulta = cliente()
    .from('fotos')
    .select('id, url, legenda')
    .order('criado_em', { ascending: false })
    .order('ordem')
  if (limite) consulta = consulta.limit(limite)
  return executar(consulta)
}

export function buscarAvaliacoesAprovadas(limite) {
  let consulta = cliente()
    .from('avaliacoes')
    .select('id, nome, nota, comentario, criado_em')
    .eq('status', 'aprovada')
    .order('criado_em', { ascending: false })
  if (limite) consulta = consulta.limit(limite)
  return executar(consulta)
}

/** Perfil (linha única) e horários de funcionamento, buscados juntos */
export async function buscarDadosNegocio() {
  const [perfil, horarios] = await Promise.all([
    executar(
      cliente()
        .from('perfil')
        .select('sobre, whatsapp, instagram, endereco, link_mapa, foto_url')
        .eq('id', 1)
        .maybeSingle(),
    ),
    executar(cliente().from('horarios_funcionamento').select('*').order('dia_semana')),
  ])
  return { perfil, horarios }
}

/**
 * Envia uma avaliação. O banco grava sempre como "pendente".
 * Não pede os dados de volta: o público não lê avaliações pendentes.
 */
export async function enviarAvaliacao({ nome, nota, comentario }) {
  const { error } = await cliente()
    .from('avaliacoes')
    .insert({ nome: nome.trim(), nota, comentario: comentario.trim() || null })
  if (error) throw error
}

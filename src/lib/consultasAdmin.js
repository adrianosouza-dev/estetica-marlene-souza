import { supabase } from './supabase'
import { juntarTimestamp } from './agendaAdmin'
import { somarDias } from './disponibilidade'

/*
 * Consultas do painel. Só funcionam com a profissional logada: o banco
 * (Row Level Security) não entrega agendamentos para mais ninguém.
 */

function cliente() {
  if (!supabase) throw new Error('O site ainda não está conectado ao banco de dados.')
  return supabase
}

async function executar(consulta) {
  const { data, error, count } = await consulta
  if (error) throw error
  return count ?? data
}

/** Campos de um agendamento, já com o nome do serviço */
const CAMPOS_AGENDAMENTO =
  'id, inicio, fim, status, cliente_nome, cliente_whatsapp, observacao, servico:servicos(id, nome, duracao_minutos)'

const inicioDoDia = (data) => `${data}T00:00:00`

/** Agendamentos com início entre as datas (inclusive), em ordem de horário */
export function buscarAgendamentosPeriodo({ de, ate, incluirCancelados = true }) {
  let consulta = cliente()
    .from('agendamentos')
    .select(CAMPOS_AGENDAMENTO)
    .gte('inicio', inicioDoDia(de))
    .lt('inicio', inicioDoDia(somarDias(ate, 1)))
    .order('inicio')
  if (!incluirCancelados) consulta = consulta.neq('status', 'cancelado')
  return executar(consulta)
}

/** Agendamentos de um dia, para a agenda */
export function buscarAgendaDoDia(data) {
  return buscarAgendamentosPeriodo({ de: data, ate: data })
}

/** Folgas e feriados que cruzam um dia */
export function buscarBloqueiosDoDia(data) {
  return executar(
    cliente()
      .from('bloqueios')
      .select('id, inicio, fim, motivo')
      .lt('inicio', inicioDoDia(somarDias(data, 1)))
      .gt('fim', inicioDoDia(data)),
  )
}

/** Quantidade de linhas que atendem aos filtros, sem baixar os dados */
function contar(tabela, filtrar) {
  return executar(filtrar(cliente().from(tabela).select('id', { count: 'exact', head: true })))
}

/**
 * Tudo que o início do painel mostra, numa busca só.
 * agoraTs: '2026-10-30T09:15:00' (agora em Maués); semana: { inicio, fim }
 */
export async function buscarResumoPainel({ hoje, agoraTs, semana }) {
  const [deHoje, proximos, totalSemana, pendentes, avaliacoesPendentes] = await Promise.all([
    buscarAgendamentosPeriodo({ de: hoje, ate: hoje, incluirCancelados: false }),
    executar(
      cliente()
        .from('agendamentos')
        .select(CAMPOS_AGENDAMENTO)
        .gte('inicio', inicioDoDia(somarDias(hoje, 1)))
        .neq('status', 'cancelado')
        .order('inicio')
        .limit(5),
    ),
    contar('agendamentos', (q) =>
      q
        .gte('inicio', inicioDoDia(semana.inicio))
        .lt('inicio', inicioDoDia(somarDias(semana.fim, 1)))
        .neq('status', 'cancelado'),
    ),
    contar('agendamentos', (q) => q.eq('status', 'pendente').gte('fim', agoraTs)),
    contar('avaliacoes', (q) => q.eq('status', 'pendente')),
  ])
  return { deHoje, proximos, totalSemana, pendentes, avaliacoesPendentes }
}

/** Tira da busca os caracteres que têm significado especial no filtro do Supabase */
const limparBusca = (texto) => texto.replace(/[,()%*\\]/g, ' ').trim()

/**
 * Histórico: agendamentos que já começaram, do mais recente para o mais antigo.
 * filtros: { de, ate, busca, status, limite, agoraTs }
 */
export async function buscarHistorico({ de, ate, busca, status, limite, agoraTs }) {
  const aplicarFiltros = (q) => {
    q = q.gte('inicio', inicioDoDia(de)).lt('inicio', inicioDoDia(somarDias(ate, 1))).lt('inicio', agoraTs)
    const termo = limparBusca(busca ?? '')
    if (termo) {
      const digitos = termo.replace(/\D/g, '')
      q = q.or(
        digitos.length >= 4
          ? `cliente_nome.ilike.%${termo}%,cliente_whatsapp.ilike.%${digitos}%`
          : `cliente_nome.ilike.%${termo}%`,
      )
    }
    return q
  }

  let lista = aplicarFiltros(
    cliente().from('agendamentos').select(CAMPOS_AGENDAMENTO, { count: 'exact' }),
  ).order('inicio', { ascending: false })
  if (status) lista = lista.eq('status', status)

  const [resultado, concluidos, cancelados] = await Promise.all([
    lista.range(0, limite - 1),
    contar('agendamentos', (q) => aplicarFiltros(q).eq('status', 'concluido')),
    contar('agendamentos', (q) => aplicarFiltros(q).eq('status', 'cancelado')),
  ])
  if (resultado.error) throw resultado.error
  return { itens: resultado.data, total: resultado.count, concluidos, cancelados }
}

/**
 * Muda o status. Confere se alguma linha mudou de fato: quando o banco nega
 * por permissão, ele não dá erro, só não altera nada.
 * Erro 23P01 ao reabrir = o horário já foi ocupado por outro agendamento.
 */
export async function mudarStatus(id, status) {
  const { data, error } = await cliente().from('agendamentos').update({ status }).eq('id', id).select('id')
  if (error) throw error
  if (!data?.length) throw new Error('Não foi possível alterar este agendamento. Entre de novo no painel.')
}

/** Serviços ativos para o formulário de novo agendamento */
export function buscarServicosAtivosAdmin() {
  return executar(cliente().from('servicos').select('id, nome, duracao_minutos').eq('ativo', true).order('ordem'))
}

/**
 * Agendamento criado pela Marlene (cliente que marcou por WhatsApp ou pessoalmente).
 * Já entra confirmado. WhatsApp e observação são opcionais.
 */
export async function criarAgendamentoPainel({ servicoId, data, minutos, nome, whatsapp, observacao }) {
  const { error } = await cliente()
    .from('agendamentos')
    .insert({
      servico_id: servicoId,
      inicio: juntarTimestamp(data, minutos),
      cliente_nome: nome.trim(),
      cliente_whatsapp: whatsapp || null,
      observacao: observacao?.trim() || null,
      status: 'confirmado',
    })
  if (error) throw error
}

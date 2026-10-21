/*
 * Regras e textos da agenda do painel. Funções puras, testadas em
 * agendaAdmin.test.js. Datas como 'AAAA-MM-DD' e horas em minutos,
 * igual a disponibilidade.js.
 */
import { diaDaSemana, horaParaMinutos, minutosParaHora, somarDias } from './disponibilidade'
import { formatarDataLonga, formatarMinutos } from './formatadores'

export const STATUS = {
  pendente: { rotulo: 'Aguardando confirmação', curto: 'Pendente' },
  confirmado: { rotulo: 'Confirmado', curto: 'Confirmado' },
  concluido: { rotulo: 'Concluído', curto: 'Concluído' },
  cancelado: { rotulo: 'Cancelado', curto: 'Cancelado' },
}

/** '2026-10-30T09:30:00' → { data: '2026-10-30', minutos: 570 } */
export function separarTimestamp(timestamp) {
  return { data: timestamp.slice(0, 10), minutos: horaParaMinutos(timestamp.slice(11, 16)) }
}

/** Data + minutos → '2026-10-30T09:30:00' (formato aceito pelo banco) */
export function juntarTimestamp(data, minutos) {
  return `${data}T${minutosParaHora(minutos)}:00`
}

/** Já terminou? Compara com "agora" em Maués ({ data, minutos }) */
export function jaTerminou(agendamento, agora) {
  const fim = separarTimestamp(agendamento.fim)
  return fim.data < agora.data || (fim.data === agora.data && fim.minutos <= agora.minutos)
}

/** Atendimento que já passou e continua pendente ou confirmado: a Marlene esqueceu de dar baixa */
export function semBaixa(agendamento, agora) {
  return ['pendente', 'confirmado'].includes(agendamento.status) && jaTerminou(agendamento, agora)
}

/**
 * Ações possíveis em cada status, na ordem dos botões.
 * "Concluir" só aparece para pendentes depois que o horário passou
 * (antes disso, o natural é confirmar primeiro).
 */
export function acoesPermitidas(agendamento, agora) {
  switch (agendamento.status) {
    case 'pendente':
      return jaTerminou(agendamento, agora) ? ['concluir', 'cancelar'] : ['confirmar', 'cancelar']
    case 'confirmado':
      return ['concluir', 'cancelar']
    case 'cancelado':
      return ['reabrir']
    default:
      return []
  }
}

/** Status que cada ação grava no banco */
export const NOVO_STATUS = {
  confirmar: 'confirmado',
  concluir: 'concluido',
  cancelar: 'cancelado',
  reabrir: 'pendente',
}

/**
 * Número salvo (só dígitos, com ou sem 55) → número para o link do WhatsApp.
 * Retorna null se estiver vazio ou num formato que não dá para usar.
 */
export function whatsappDaCliente(numero) {
  const d = String(numero ?? '').replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) return `55${d}`
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d
  return null
}

const primeiroNome = (nome) => nome.trim().split(/\s+/)[0]

/** Mensagem pronta para a Marlene mandar à cliente */
export function mensagemParaCliente(agendamento) {
  const nome = primeiroNome(agendamento.cliente_nome)
  if (!['pendente', 'confirmado'].includes(agendamento.status)) return `Olá, ${nome}!`

  const { data, minutos } = separarTimestamp(agendamento.inicio)
  const servico = agendamento.servico?.nome ?? 'atendimento'
  return `Olá, ${nome}! Confirmo seu horário de ${servico} ${formatarDataLonga(data)}, às ${formatarMinutos(minutos)}. Até lá!`
}

/** Semana de segunda a domingo que contém a data */
export function semanaDe(data) {
  const dia = diaDaSemana(data) // 0 = domingo
  const inicio = somarDias(data, dia === 0 ? -6 : 1 - dia)
  return { inicio, fim: somarDias(inicio, 6) }
}

/** Saudação conforme a hora em Maués */
export function saudacao(minutos) {
  if (minutos < 12 * 60) return 'Bom dia'
  if (minutos < 18 * 60) return 'Boa tarde'
  return 'Boa noite'
}

/** Primeiro do mês e último dia do mês, para os filtros do histórico */
export function mesDe(data) {
  const inicio = `${data.slice(0, 7)}-01`
  const [ano, mes] = data.split('-').map(Number)
  const proximo = mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`
  return { inicio, fim: somarDias(proximo, -1) }
}

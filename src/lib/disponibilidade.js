/*
 * Cálculo dos horários livres para agendamento.
 *
 * Funções puras (sem banco e sem tela), testadas em disponibilidade.test.js.
 *
 * Como datas e horas são representadas aqui:
 *   - data:    texto 'AAAA-MM-DD' (ex.: '2026-10-23')
 *   - horário: minutos desde a meia-noite (ex.: 9h30 = 570)
 * Usar texto e números simples, em vez de objetos Date, evita que o fuso horário
 * do celular da cliente mude o dia ou a hora sem querer. Tudo segue o horário de
 * Maués (America/Manaus), o mesmo que o banco usa para validar.
 */

export const FUSO_HORARIO = 'America/Manaus'

/** De quanto em quanto tempo os horários são oferecidos */
export const INTERVALO_MINUTOS = 30

const MINUTOS_NO_DIA = 24 * 60

/** Data e hora atuais em Maués: { data: '2026-10-21', minutos: 845 } */
export function agoraEmManaus(instante = new Date()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO_HORARIO,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  )
  return {
    data: `${partes.year}-${partes.month}-${partes.day}`,
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
  }
}

/** '08:30:00' ou '08:30' → 510 */
export function horaParaMinutos(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

/** 510 → '08:30' */
export function minutosParaHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0')
  const m = String(minutos % 60).padStart(2, '0')
  return `${h}:${m}`
}

// Datas viram meio-dia UTC só para fazer contas de calendário, sem risco de fuso
const paraDate = (data) => new Date(`${data}T12:00:00Z`)

/** '2026-10-31' + 1 → '2026-11-01' */
export function somarDias(data, dias) {
  const d = paraDate(data)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Quantos dias de "de" até "ate" (pode ser negativo) */
export function diasEntre(de, ate) {
  return Math.round((paraDate(ate) - paraDate(de)) / 86_400_000)
}

/** 0 = domingo ... 6 = sábado, igual ao banco */
export function diaDaSemana(data) {
  return paraDate(data).getUTCDay()
}

/** Data + minutos → texto aceito pelo banco: '2026-10-23T09:30:00' */
export function montarTimestamp(data, minutos) {
  return `${data}T${minutosParaHora(minutos)}:00`
}

/**
 * Recorta uma lista de períodos ({ inicio, fim } vindos do banco) para um dia,
 * em minutos. Um bloqueio de vários dias ocupa o dia inteiro nos dias do meio.
 */
export function periodosNoDia(data, periodos = []) {
  const resultado = []
  for (const { inicio, fim } of periodos) {
    const dataInicio = inicio.slice(0, 10)
    const dataFim = fim.slice(0, 10)
    if (dataInicio > data || dataFim < data) continue

    const de = dataInicio < data ? 0 : horaParaMinutos(inicio.slice(11, 16))
    const ate = dataFim > data ? MINUTOS_NO_DIA : horaParaMinutos(fim.slice(11, 16))
    if (ate > de) resultado.push({ inicio: de, fim: ate })
  }
  return resultado
}

/** Dois períodos [inicio, fim) se cruzam? Encostar (um termina às 10h, outro começa às 10h) não conta. */
const cruzam = (a, b) => a.inicio < b.fim && a.fim > b.inicio

/**
 * Horários em que o atendimento inteiro cabe, em minutos.
 *
 * horario:   linha de horarios_funcionamento do dia da semana
 * duracao:   duração máxima do serviço, em minutos
 * ocupados:  resultado de horarios_ocupados(dia)
 * bloqueios: folgas e feriados que podem cair no dia
 * agora:     resultado de agoraEmManaus()
 */
export function gerarHorariosLivres({
  data,
  horario,
  duracao,
  ocupados = [],
  bloqueios = [],
  agora,
  antecedenciaMinutos = 60,
  intervalo = INTERVALO_MINUTOS,
}) {
  if (!horario?.aberto) return []

  const abre = horaParaMinutos(horario.abre)
  const fecha = horaParaMinutos(horario.fecha)

  const indisponiveis = [...periodosNoDia(data, ocupados), ...periodosNoDia(data, bloqueios)]
  if (horario.almoco_inicio && horario.almoco_fim) {
    indisponiveis.push({ inicio: horaParaMinutos(horario.almoco_inicio), fim: horaParaMinutos(horario.almoco_fim) })
  }

  // Primeiro horário possível, contado a partir de "agora" (pode cair em outro dia)
  const minimoDesdeHoje = agora.minutos + antecedenciaMinutos
  const deslocamentoDoDia = diasEntre(agora.data, data) * MINUTOS_NO_DIA

  const livres = []
  for (let inicio = abre; inicio + duracao <= fecha; inicio += intervalo) {
    if (deslocamentoDoDia + inicio < minimoDesdeHoje) continue
    const atendimento = { inicio, fim: inicio + duracao }
    if (indisponiveis.some((p) => cruzam(atendimento, p))) continue
    livres.push(inicio)
  }
  return livres
}

/**
 * Dias que aparecem para escolha, de hoje até o limite do perfil.
 * Cada dia diz se há atendimento e, se não houver, o motivo.
 * Um bloqueio que cobre todo o expediente fecha o dia; bloqueios parciais
 * só tiram alguns horários (isso é resolvido em gerarHorariosLivres).
 */
export function listarDias({ agora, diasMaximos, horarios = [], bloqueios = [], antecedenciaMinutos = 60 }) {
  const dias = []
  for (let i = 0; i <= diasMaximos; i++) {
    const data = somarDias(agora.data, i)
    const horario = horarios.find((h) => h.dia_semana === diaDaSemana(data))

    let motivo = null
    if (!horario?.aberto) {
      motivo = 'Fechado'
    } else if (i * MINUTOS_NO_DIA + horaParaMinutos(horario.fecha) <= agora.minutos + antecedenciaMinutos) {
      // Hoje, já perto ou depois do fechamento: não sobra horário possível
      motivo = 'Encerrado'
    } else {
      const expediente = { inicio: horaParaMinutos(horario.abre), fim: horaParaMinutos(horario.fecha) }
      const bloqueioDoDia = bloqueios.find((b) =>
        periodosNoDia(data, [b]).some((p) => p.inicio <= expediente.inicio && p.fim >= expediente.fim),
      )
      if (bloqueioDoDia) motivo = bloqueioDoDia.motivo || 'Sem atendimento'
    }

    dias.push({ data, disponivel: !motivo, motivo })
  }
  return dias
}

import { describe, expect, it } from 'vitest'
import {
  agoraEmManaus,
  diaDaSemana,
  gerarHorariosLivres,
  listarDias,
  minutosParaHora,
  montarTimestamp,
  periodosNoDia,
  somarDias,
} from './disponibilidade'

// Semana de referência: 2026-10-19 é segunda-feira
const SEGUNDA = '2026-10-19'
const SABADO = '2026-10-24'
const DOMINGO = '2026-10-25'

// Horário padrão: 8h às 17h, almoço 12h às 13h; domingo fechado
const HORARIOS = [
  { dia_semana: 0, aberto: false, abre: null, fecha: null, almoco_inicio: null, almoco_fim: null },
  ...[1, 2, 3, 4, 5, 6].map((dia_semana) => ({
    dia_semana,
    aberto: true,
    abre: '08:00:00',
    fecha: '17:00:00',
    almoco_inicio: '12:00:00',
    almoco_fim: '13:00:00',
  })),
]
const HORARIO_SEGUNDA = HORARIOS[1]

// "Agora" bem antes do dia testado, para a antecedência não interferir
const ONTEM_CEDO = { data: '2026-10-18', minutos: 6 * 60 }

/** Facilita a leitura dos resultados: [480, 510] → ['08:00', '08:30'] */
const horas = (lista) => lista.map(minutosParaHora)

function livres(opcoes) {
  return horas(
    gerarHorariosLivres({ data: SEGUNDA, horario: HORARIO_SEGUNDA, agora: ONTEM_CEDO, ...opcoes }),
  )
}

describe('funções de data', () => {
  it('soma dias atravessando mês e ano', () => {
    expect(somarDias('2026-10-31', 1)).toBe('2026-11-01')
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('descobre o dia da semana no padrão do banco (0 = domingo)', () => {
    expect(diaDaSemana(SEGUNDA)).toBe(1)
    expect(diaDaSemana(SABADO)).toBe(6)
    expect(diaDaSemana(DOMINGO)).toBe(0)
  })

  it('monta o timestamp no formato do banco', () => {
    expect(montarTimestamp('2026-10-23', 570)).toBe('2026-10-23T09:30:00')
  })

  it('usa o horário de Maués, não o do servidor (UTC)', () => {
    // 01:30 UTC do dia 22 = 21:30 do dia 21 em Maués (UTC-4)
    expect(agoraEmManaus(new Date('2026-10-22T01:30:00Z'))).toEqual({ data: '2026-10-21', minutos: 21 * 60 + 30 })
  })
})

describe('periodosNoDia', () => {
  it('recorta para o dia e converte para minutos', () => {
    expect(periodosNoDia(SEGUNDA, [{ inicio: '2026-10-19T08:00:00', fim: '2026-10-19T10:00:00' }])).toEqual([
      { inicio: 480, fim: 600 },
    ])
  })

  it('bloqueio de vários dias ocupa o dia inteiro no meio', () => {
    const folga = [{ inicio: '2026-10-18T00:00:00', fim: '2026-10-21T00:00:00' }]
    expect(periodosNoDia(SEGUNDA, folga)).toEqual([{ inicio: 0, fim: 1440 }])
    expect(periodosNoDia('2026-10-21', folga)).toEqual([]) // termina à 0h do dia 21
  })
})

describe('gerarHorariosLivres', () => {
  it('serviço de 1h: de 30 em 30 min, pulando o almoço e terminando até as 17h', () => {
    expect(livres({ duracao: 60 })).toEqual([
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
    ])
  })

  it('serviço de 2h: não começa se for atravessar o almoço ou passar das 17h', () => {
    expect(livres({ duracao: 120 })).toEqual(['08:00', '08:30', '09:00', '09:30', '10:00', '13:00', '13:30', '14:00', '14:30', '15:00'])
  })

  it('serviço de 3h: só cabe de manhã cedo ou à tarde', () => {
    expect(livres({ duracao: 180 })).toEqual(['08:00', '08:30', '09:00', '13:00', '13:30', '14:00'])
  })

  it('pode terminar exatamente quando outro começa', () => {
    const ocupados = [{ inicio: '2026-10-19T10:00:00', fim: '2026-10-19T12:00:00' }]
    expect(livres({ duracao: 120, ocupados })).toEqual(['08:00', '13:00', '13:30', '14:00', '14:30', '15:00'])
  })

  it('não oferece horário que cruza um agendamento', () => {
    const ocupados = [{ inicio: '2026-10-19T14:00:00', fim: '2026-10-19T15:00:00' }]
    const resultado = livres({ duracao: 60, ocupados })
    expect(resultado).not.toContain('13:30')
    expect(resultado).not.toContain('14:00')
    expect(resultado).not.toContain('14:30')
    expect(resultado).toContain('13:00')
    expect(resultado).toContain('15:00')
  })

  it('respeita bloqueio de parte do dia', () => {
    const bloqueios = [{ inicio: '2026-10-19T13:00:00', fim: '2026-10-19T17:00:00', motivo: 'Médico' }]
    expect(livres({ duracao: 60, bloqueios })).toEqual(['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'])
  })

  it('dia sem almoço cadastrado', () => {
    const semAlmoco = { ...HORARIO_SEGUNDA, almoco_inicio: null, almoco_fim: null }
    expect(livres({ duracao: 120, horario: semAlmoco })).toContain('11:00')
  })

  it('hoje: só a partir de agora + antecedência', () => {
    const agora = { data: SEGUNDA, minutos: 9 * 60 + 10 } // 9h10
    const resultado = horas(
      gerarHorariosLivres({ data: SEGUNDA, horario: HORARIO_SEGUNDA, duracao: 60, agora, antecedenciaMinutos: 60 }),
    )
    expect(resultado[0]).toBe('10:30') // 10h10 arredonda para o próximo horário: 10h30
  })

  it('antecedência que passa da meia-noite afeta o dia seguinte', () => {
    const agora = { data: '2026-10-18', minutos: 23 * 60 } // domingo 23h
    const resultado = horas(
      gerarHorariosLivres({ data: SEGUNDA, horario: HORARIO_SEGUNDA, duracao: 60, agora, antecedenciaMinutos: 600 }),
    )
    expect(resultado[0]).toBe('09:00') // 23h + 10h = segunda 9h
  })

  it('dia no passado não tem horários', () => {
    const agora = { data: '2026-10-20', minutos: 8 * 60 }
    expect(gerarHorariosLivres({ data: SEGUNDA, horario: HORARIO_SEGUNDA, duracao: 60, agora })).toEqual([])
  })

  it('dia fechado não tem horários', () => {
    expect(gerarHorariosLivres({ data: DOMINGO, horario: HORARIOS[0], duracao: 60, agora: ONTEM_CEDO })).toEqual([])
  })
})

describe('listarDias', () => {
  const agora = { data: SEGUNDA, minutos: 8 * 60 }

  it('vai de hoje até o limite (inclusive)', () => {
    const dias = listarDias({ agora, diasMaximos: 30, horarios: HORARIOS })
    expect(dias).toHaveLength(31)
    expect(dias[0].data).toBe(SEGUNDA)
    expect(dias.at(-1).data).toBe('2026-11-18')
  })

  it('domingo aparece como fechado', () => {
    const dias = listarDias({ agora, diasMaximos: 7, horarios: HORARIOS })
    expect(dias.find((d) => d.data === DOMINGO)).toEqual({ data: DOMINGO, disponivel: false, motivo: 'Fechado' })
  })

  it('folga de dia inteiro fecha o dia com o motivo; bloqueio parcial não', () => {
    const bloqueios = [
      { inicio: '2026-10-21T00:00:00', fim: '2026-10-22T00:00:00', motivo: 'Feriado' },
      { inicio: '2026-10-23T14:00:00', fim: '2026-10-23T16:00:00', motivo: 'Médico' },
    ]
    const dias = listarDias({ agora, diasMaximos: 7, horarios: HORARIOS, bloqueios })
    expect(dias.find((d) => d.data === '2026-10-21')).toMatchObject({ disponivel: false, motivo: 'Feriado' })
    expect(dias.find((d) => d.data === '2026-10-23')).toMatchObject({ disponivel: true })
  })

  it('hoje aparece como "Encerrado" quando não dá mais tempo (fechamento - antecedência)', () => {
    const tarde = { data: SEGUNDA, minutos: 16 * 60 + 10 } // 16h10, fecha às 17h, antecedência 1h
    expect(listarDias({ agora: tarde, diasMaximos: 1, horarios: HORARIOS })[0]).toMatchObject({
      disponivel: false,
      motivo: 'Encerrado',
    })
    const cedo = { data: SEGUNDA, minutos: 15 * 60 } // 15h: ainda dá para 16h
    expect(listarDias({ agora: cedo, diasMaximos: 1, horarios: HORARIOS })[0].disponivel).toBe(true)
  })

  it('folga sem motivo aparece como "Sem atendimento"', () => {
    const bloqueios = [{ inicio: '2026-10-20T00:00:00', fim: '2026-10-21T00:00:00', motivo: null }]
    const dias = listarDias({ agora, diasMaximos: 2, horarios: HORARIOS, bloqueios })
    expect(dias[1]).toMatchObject({ disponivel: false, motivo: 'Sem atendimento' })
  })
})

import { describe, expect, it } from 'vitest'
import {
  acoesPermitidas,
  jaTerminou,
  mensagemParaCliente,
  mesDe,
  saudacao,
  semanaDe,
  semBaixa,
  separarTimestamp,
  whatsappDaCliente,
} from './agendaAdmin'

const agendamento = (status, inicio = '2026-10-30T09:00:00', fim = '2026-10-30T11:00:00') => ({
  status,
  inicio,
  fim,
  cliente_nome: 'Ana Paula Ferreira',
  servico: { nome: 'Manicure' },
})

const ANTES = { data: '2026-10-30', minutos: 8 * 60 } // antes do atendimento
const DEPOIS = { data: '2026-10-30', minutos: 11 * 60 } // exatamente no fim

describe('horário do agendamento', () => {
  it('separa data e minutos', () => {
    expect(separarTimestamp('2026-10-30T09:30:00')).toEqual({ data: '2026-10-30', minutos: 570 })
  })

  it('terminou quando "agora" chega ao fim', () => {
    expect(jaTerminou(agendamento('pendente'), ANTES)).toBe(false)
    expect(jaTerminou(agendamento('pendente'), DEPOIS)).toBe(true)
    expect(jaTerminou(agendamento('pendente'), { data: '2026-10-31', minutos: 0 })).toBe(true)
  })

  it('"sem baixa": passou e ficou pendente ou confirmado', () => {
    expect(semBaixa(agendamento('confirmado'), DEPOIS)).toBe(true)
    expect(semBaixa(agendamento('pendente'), DEPOIS)).toBe(true)
    expect(semBaixa(agendamento('concluido'), DEPOIS)).toBe(false)
    expect(semBaixa(agendamento('cancelado'), DEPOIS)).toBe(false)
    expect(semBaixa(agendamento('confirmado'), ANTES)).toBe(false)
  })
})

describe('ações de cada status', () => {
  it('pendente futuro: confirmar ou cancelar', () => {
    expect(acoesPermitidas(agendamento('pendente'), ANTES)).toEqual(['confirmar', 'cancelar'])
  })
  it('pendente que já passou: concluir ou cancelar', () => {
    expect(acoesPermitidas(agendamento('pendente'), DEPOIS)).toEqual(['concluir', 'cancelar'])
  })
  it('confirmado: concluir ou cancelar', () => {
    expect(acoesPermitidas(agendamento('confirmado'), ANTES)).toEqual(['concluir', 'cancelar'])
  })
  it('cancelado: reabrir; concluído: nada', () => {
    expect(acoesPermitidas(agendamento('cancelado'), ANTES)).toEqual(['reabrir'])
    expect(acoesPermitidas(agendamento('concluido'), DEPOIS)).toEqual([])
  })
})

describe('WhatsApp da cliente', () => {
  it('acrescenta o 55 quando falta', () => {
    expect(whatsappDaCliente('92991234567')).toBe('5592991234567')
    expect(whatsappDaCliente('9233214567')).toBe('559233214567')
  })
  it('mantém quando já tem 55', () => {
    expect(whatsappDaCliente('5592991234567')).toBe('5592991234567')
  })
  it('vazio ou estranho: sem link', () => {
    expect(whatsappDaCliente(null)).toBeNull()
    expect(whatsappDaCliente('')).toBeNull()
    expect(whatsappDaCliente('123')).toBeNull()
  })

  it('mensagem de confirmação usa o primeiro nome, serviço, dia e hora', () => {
    expect(mensagemParaCliente(agendamento('pendente'))).toBe(
      'Olá, Ana! Confirmo seu horário de Manicure sexta-feira, 30 de outubro, às 9h. Até lá!',
    )
    expect(mensagemParaCliente(agendamento('concluido'))).toBe('Olá, Ana!')
  })
})

describe('períodos', () => {
  it('semana de segunda a domingo', () => {
    expect(semanaDe('2026-10-30')).toEqual({ inicio: '2026-10-26', fim: '2026-11-01' }) // sexta
    expect(semanaDe('2026-11-01')).toEqual({ inicio: '2026-10-26', fim: '2026-11-01' }) // domingo
    expect(semanaDe('2026-10-26')).toEqual({ inicio: '2026-10-26', fim: '2026-11-01' }) // segunda
  })

  it('mês inteiro, inclusive dezembro e fevereiro', () => {
    expect(mesDe('2026-10-21')).toEqual({ inicio: '2026-10-01', fim: '2026-10-31' })
    expect(mesDe('2026-12-05')).toEqual({ inicio: '2026-12-01', fim: '2026-12-31' })
    expect(mesDe('2028-02-10')).toEqual({ inicio: '2028-02-01', fim: '2028-02-29' })
  })

  it('saudação pela hora', () => {
    expect(saudacao(8 * 60)).toBe('Bom dia')
    expect(saudacao(14 * 60)).toBe('Boa tarde')
    expect(saudacao(19 * 60)).toBe('Boa noite')
  })
})

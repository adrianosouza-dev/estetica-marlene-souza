import { describe, expect, it } from 'vitest'
import {
  formatarDataCurta,
  formatarDataLonga,
  formatarDuracao,
  formatarMinutos,
  formatarPreco,
  formatarTelefone,
  mascararTelefone,
  resumirHorarios,
} from './formatadores'

describe('preço e duração', () => {
  it('preço zero vira "Consultar"', () => {
    expect(formatarPreco(0)).toBe('Consultar')
    expect(formatarPreco('35.00')).toMatch(/^R\$\s35,00$/)
  })

  it('duração mostra o máximo', () => {
    expect(formatarDuracao(120)).toBe('até 2h')
    expect(formatarDuracao(90)).toBe('até 1h30')
    expect(formatarDuracao(45)).toBe('até 45 min')
  })
})

describe('datas e horas do agendamento', () => {
  it('formata sem depender do fuso do computador', () => {
    expect(formatarDataLonga('2026-10-23')).toBe('sexta-feira, 23 de outubro')
    expect(formatarDataCurta('2026-10-23')).toEqual({ semana: 'sex', diaMes: '23/10' })
  })

  it('minutos viram hora curta', () => {
    expect(formatarMinutos(540)).toBe('9h')
    expect(formatarMinutos(810)).toBe('13h30')
  })
})

describe('telefone', () => {
  it('máscara acompanha a digitação', () => {
    expect(mascararTelefone('9')).toBe('(9')
    expect(mascararTelefone('92991')).toBe('(92) 991')
    expect(mascararTelefone('92991234567')).toBe('(92) 99123-4567')
    expect(mascararTelefone('9233214567')).toBe('(92) 3321-4567')
  })

  it('ignora letras e corta excesso de dígitos', () => {
    expect(mascararTelefone('(92) 99123-45678999')).toBe('(92) 99123-4567')
    expect(mascararTelefone('abc')).toBe('')
  })

  it('formata número salvo no banco, com ou sem 55', () => {
    expect(formatarTelefone('5592991234567')).toBe('(92) 99123-4567')
    expect(formatarTelefone('92991234567')).toBe('(92) 99123-4567')
  })
})

describe('resumo do horário de funcionamento', () => {
  const dia = (dia_semana, aberto = true, abre = '08:00:00', fecha = '17:00:00') => ({ dia_semana, aberto, abre, fecha })

  it('junta dias seguidos com o mesmo horário', () => {
    const semana = [dia(0, false), dia(1), dia(2), dia(3), dia(4), dia(5), dia(6)]
    expect(resumirHorarios(semana)).toBe('Segunda a sábado, das 8h às 17h')
  })

  it('separa quando o sábado tem outro horário', () => {
    const semana = [dia(0, false), dia(1), dia(2), dia(3), dia(4), dia(5), dia(6, true, '08:00:00', '12:00:00')]
    expect(resumirHorarios(semana)).toBe('Segunda a sexta, das 8h às 17h; Sábado, das 8h às 12h')
  })
})

import { describe, expect, it } from 'vitest'
import {
  limparInstagram,
  linkValido,
  opcoesDuracao,
  precoParaTexto,
  textoParaPreco,
  validarHorarioDia,
  whatsappDoPerfil,
  whatsappParaPerfil,
} from './edicao'

describe('preço', () => {
  it('número → texto do campo', () => {
    expect(precoParaTexto(35.5)).toBe('35,50')
    expect(precoParaTexto('120.00')).toBe('120,00')
    expect(precoParaTexto(0)).toBe('')
  })

  it('texto do campo → número', () => {
    expect(textoParaPreco('35,50')).toBe(35.5)
    expect(textoParaPreco('35.5')).toBe(35.5)
    expect(textoParaPreco('R$ 40')).toBe(40)
    expect(textoParaPreco('1.250,00')).toBe(1250)
    expect(textoParaPreco('')).toBe(0)
  })

  it('texto inválido vira NaN', () => {
    expect(textoParaPreco('abc')).toBeNaN()
    expect(textoParaPreco('35,555')).toBeNaN()
    expect(textoParaPreco('-10')).toBeNaN()
  })
})

describe('duração', () => {
  it('de 15 min a 8h, de 15 em 15', () => {
    const opcoes = opcoesDuracao()
    expect(opcoes).toHaveLength(32)
    expect(opcoes[0]).toEqual({ minutos: 15, rotulo: '15 min' })
    expect(opcoes.find((o) => o.minutos === 90).rotulo).toBe('1h30')
    expect(opcoes.at(-1)).toEqual({ minutos: 480, rotulo: '8h' })
  })
})

describe('validarHorarioDia', () => {
  const dia = (extra) => ({ aberto: true, abre: '08:00', fecha: '17:00', temAlmoco: true, almoco_inicio: '12:00', almoco_fim: '13:00', ...extra })

  it('horário normal passa', () => {
    expect(validarHorarioDia(dia())).toEqual({})
  })
  it('dia fechado não precisa de horas', () => {
    expect(validarHorarioDia({ aberto: false })).toEqual({})
  })
  it('fechar antes de abrir', () => {
    expect(validarHorarioDia(dia({ fecha: '07:00' }))).toHaveProperty('fecha')
  })
  it('almoço invertido ou fora do expediente', () => {
    expect(validarHorarioDia(dia({ almoco_fim: '11:00' }))).toHaveProperty('almoco_fim')
    expect(validarHorarioDia(dia({ almoco_inicio: '16:30', almoco_fim: '17:30' }))).toHaveProperty('almoco_inicio')
  })
  it('sem almoço ignora os campos de almoço', () => {
    expect(validarHorarioDia(dia({ temAlmoco: false, almoco_inicio: '', almoco_fim: '' }))).toEqual({})
  })
})

describe('perfil', () => {
  it('Instagram: usuário, @ ou link', () => {
    expect(limparInstagram('@marlene.unhas')).toBe('marlene.unhas')
    expect(limparInstagram('https://www.instagram.com/marlene.unhas/?igsh=abc')).toBe('marlene.unhas')
    expect(limparInstagram('instagram.com/marlene_unhas')).toBe('marlene_unhas')
    expect(limparInstagram('')).toBe('')
  })

  it('WhatsApp: ida e volta com o 55', () => {
    expect(whatsappParaPerfil('(92) 99123-4567')).toBe('5592991234567')
    expect(whatsappParaPerfil('5592991234567')).toBe('5592991234567')
    expect(whatsappParaPerfil('')).toBeNull()
    expect(whatsappDoPerfil('5592991234567')).toBe('92991234567')
  })

  it('link do mapa', () => {
    expect(linkValido('')).toBe(true)
    expect(linkValido('https://maps.app.goo.gl/abc')).toBe(true)
    expect(linkValido('javascript:alert(1)')).toBe(false)
    expect(linkValido('mapa da marlene')).toBe(false)
  })
})

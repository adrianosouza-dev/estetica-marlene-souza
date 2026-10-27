import { describe, expect, it } from 'vitest'
import {
  FACEBOOK_VALIDO,
  limparFacebook,
  limparInstagram,
  limparTiktok,
  linkValido,
  TIKTOK_VALIDO,
  validarCertificado,
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

  it('TikTok: @, usuário ou link do perfil viram só o usuário', () => {
    expect(limparTiktok('@marlene.unhas')).toBe('marlene.unhas')
    expect(limparTiktok('marlene_unhas')).toBe('marlene_unhas')
    expect(limparTiktok('https://www.tiktok.com/@marlene.unhas?lang=pt-BR')).toBe('marlene.unhas')
    expect(limparTiktok('tiktok.com/@marlene/video/7123456789')).toBe('marlene')
    expect(limparTiktok('')).toBe('')
  })

  it('TikTok: link encurtado não diz o perfil (null) e o formato bate com o banco', () => {
    expect(limparTiktok('https://vm.tiktok.com/ZMabc123/')).toBeNull()
    expect(TIKTOK_VALIDO.test(limparTiktok('@marlene.unhas'))).toBe(true)
    expect(TIKTOK_VALIDO.test('a')).toBe(false)
    expect(TIKTOK_VALIDO.test('x'.repeat(25))).toBe(false)
  })

  it('Facebook: @, usuário ou link do perfil viram só o usuário', () => {
    expect(limparFacebook('@marlene.unhas')).toBe('marlene.unhas')
    expect(limparFacebook('https://www.facebook.com/marlene.unhas/')).toBe('marlene.unhas')
    expect(limparFacebook('m.facebook.com/marleneunhas?ref=bookmarks')).toBe('marleneunhas')
    expect(limparFacebook('fb.com/marleneunhas')).toBe('marleneunhas')
    expect(limparFacebook('')).toBe('')
  })

  it('Facebook: perfil sem nome de usuário vira profile.php?id=', () => {
    expect(limparFacebook('https://www.facebook.com/profile.php?id=100012345678')).toBe('profile.php?id=100012345678')
    expect(limparFacebook('https://www.facebook.com/profile.php?sk=about&id=100012345678')).toBe('profile.php?id=100012345678')
    expect(limparFacebook('https://www.facebook.com/people/Marlene-Souza/100012345678/')).toBe('profile.php?id=100012345678')
    expect(FACEBOOK_VALIDO.test('profile.php?id=100012345678')).toBe(true)
  })

  it('Facebook: links de compartilhamento não dizem o perfil (null)', () => {
    expect(limparFacebook('https://www.facebook.com/share/1AbCdEf/')).toBeNull()
    expect(limparFacebook('https://fb.me/abc123')).toBeNull()
    expect(limparFacebook('https://www.facebook.com/profile.php')).toBeNull()
    expect(FACEBOOK_VALIDO.test('ab')).toBe(false)
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

describe('certificado', () => {
  const base = { titulo: 'Design de sobrancelhas', instituicao: 'Escola X', ano: '' }

  it('título e instituição obrigatórios; ano opcional', () => {
    expect(validarCertificado(base, 2026)).toEqual({})
    expect(Object.keys(validarCertificado({ titulo: ' ', instituicao: '', ano: '' }, 2026))).toEqual(['titulo', 'instituicao'])
  })

  it('ano com 4 números, de 1950 até o ano atual', () => {
    expect(validarCertificado({ ...base, ano: '2026' }, 2026)).toEqual({})
    expect(validarCertificado({ ...base, ano: 2019 }, 2026)).toEqual({})
    expect(validarCertificado({ ...base, ano: '2027' }, 2026).ano).toBeTruthy()
    expect(validarCertificado({ ...base, ano: '1949' }, 2026).ano).toBeTruthy()
    expect(validarCertificado({ ...base, ano: '19' }, 2026).ano).toBeTruthy()
  })
})

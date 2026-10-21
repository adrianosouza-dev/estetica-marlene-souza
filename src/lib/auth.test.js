import { describe, expect, it } from 'vitest'
import { traduzirErroAuth } from './auth'

describe('traduzirErroAuth', () => {
  it('senha errada', () => {
    expect(traduzirErroAuth({ code: 'invalid_credentials', message: 'Invalid login credentials' })).toBe(
      'E-mail ou senha incorretos.',
    )
    // versões antigas do Supabase mandam só a mensagem
    expect(traduzirErroAuth({ message: 'Invalid login credentials' })).toBe('E-mail ou senha incorretos.')
  })

  it('muitas tentativas', () => {
    expect(traduzirErroAuth({ status: 429, message: 'Too many requests' })).toMatch(/Muitas tentativas/)
    expect(traduzirErroAuth({ code: 'over_email_send_rate_limit' })).toMatch(/Muitas tentativas/)
  })

  it('sem internet', () => {
    expect(traduzirErroAuth({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' })).toMatch(/Sem conexão/)
  })

  it('regras da nova senha', () => {
    expect(traduzirErroAuth({ code: 'weak_password' })).toMatch(/Senha fraca/)
    expect(traduzirErroAuth({ code: 'same_password' })).toMatch(/diferente da atual/)
  })

  it('erro desconhecido vira mensagem genérica, sem detalhes técnicos', () => {
    expect(traduzirErroAuth({ message: 'unexpected_failure xyz' })).toBe('Não foi possível concluir agora. Tente de novo em instantes.')
    expect(traduzirErroAuth(undefined)).toBe('Não foi possível concluir agora. Tente de novo em instantes.')
  })
})

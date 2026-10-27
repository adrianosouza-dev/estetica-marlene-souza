import { describe, expect, it } from 'vitest'
import { redesDoPerfil } from './redes'

describe('redes sociais do perfil', () => {
  it('só entram as redes preenchidas, nesta ordem', () => {
    expect(redesDoPerfil({ instagram: null, tiktok: 'marlene', facebook: '' }).map((r) => r.rede)).toEqual(['tiktok'])
    expect(redesDoPerfil({ instagram: 'a.b', tiktok: 'c_d', facebook: 'efg' }).map((r) => r.rede)).toEqual([
      'instagram',
      'tiktok',
      'facebook',
    ])
    expect(redesDoPerfil(null)).toEqual([])
  })

  it('monta o link e o @ de cada rede', () => {
    const [instagram, tiktok, facebook] = redesDoPerfil({ instagram: 'marlene', tiktok: 'marlene', facebook: 'marlene' })
    expect(instagram).toMatchObject({ link: 'https://www.instagram.com/marlene', usuario: '@marlene' })
    expect(tiktok).toMatchObject({ link: 'https://www.tiktok.com/@marlene', usuario: '@marlene' })
    expect(facebook).toMatchObject({ link: 'https://www.facebook.com/marlene', usuario: '@marlene' })
  })

  it('Facebook sem nome de usuário: link pelo id e sem @', () => {
    const [facebook] = redesDoPerfil({ facebook: 'profile.php?id=100012345678' })
    expect(facebook).toMatchObject({ link: 'https://www.facebook.com/profile.php?id=100012345678', usuario: null })
  })
})

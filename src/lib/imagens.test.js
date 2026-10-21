import { describe, expect, it } from 'vitest'
import { calcularDimensoes } from './imagens'

describe('calcularDimensoes', () => {
  it('reduz o lado maior para 1200px mantendo a proporção', () => {
    expect(calcularDimensoes(4000, 3000)).toEqual({ largura: 1200, altura: 900 })
    expect(calcularDimensoes(3024, 4032)).toEqual({ largura: 900, altura: 1200 })
  })

  it('nunca aumenta foto pequena', () => {
    expect(calcularDimensoes(360, 640)).toEqual({ largura: 360, altura: 640 })
  })
})

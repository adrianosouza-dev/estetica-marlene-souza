/*
 * Preparo das fotos no próprio celular, antes de enviar ao Storage:
 *   - reduz para no máximo 1200px no lado maior (envio rápido no 4G);
 *   - converte para .webp (arquivo leve);
 *   - remove os dados escondidos da foto (EXIF), como a LOCALIZAÇÃO: redesenhar
 *     a imagem num <canvas> gera um arquivo novo, só com os pixels.
 */

import { erroAmigavel } from './erros'

export const LADO_MAXIMO = 1200
const QUALIDADE = 0.82

/** Novas dimensões mantendo a proporção; nunca aumenta a foto */
export function calcularDimensoes(largura, altura, ladoMaximo = LADO_MAXIMO) {
  const escala = Math.min(1, ladoMaximo / Math.max(largura, altura))
  return { largura: Math.round(largura * escala), altura: Math.round(altura * escala) }
}

const paraBlob = (canvas, tipo) => new Promise((resolver) => canvas.toBlob(resolver, tipo, QUALIDADE))

/**
 * Recebe o arquivo escolhido (File) e devolve { blob, extensao, tipo }.
 * Se o navegador não gerar .webp (iPhones antigos), usa .jpg.
 */
export async function prepararFoto(arquivo) {
  if (!arquivo?.type?.startsWith('image/')) {
    throw erroAmigavel('Escolha um arquivo de imagem (foto).')
  }

  let imagem
  try {
    // imageOrientation: respeita a rotação que a câmera gravou na foto
    imagem = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  } catch {
    throw erroAmigavel('Não foi possível abrir esta foto. Tente outra ou tire um print da foto e envie o print.')
  }

  const { largura, altura } = calcularDimensoes(imagem.width, imagem.height)
  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  canvas.getContext('2d').drawImage(imagem, 0, 0, largura, altura)
  imagem.close?.()

  let blob = await paraBlob(canvas, 'image/webp')
  if (!blob || blob.type !== 'image/webp') blob = await paraBlob(canvas, 'image/jpeg')
  if (!blob) throw erroAmigavel('Não foi possível preparar a foto. Tente de novo.')

  return { blob, tipo: blob.type, extensao: blob.type === 'image/webp' ? 'webp' : 'jpg' }
}

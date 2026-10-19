import { negocio } from '../config/negocio'

/**
 * Monta o link do WhatsApp da Marlene, com mensagem opcional já escrita.
 * Retorna null se o número ainda não foi configurado.
 */
export function linkWhatsApp(mensagem = '') {
  if (!negocio.whatsapp) return null
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''
  return `https://wa.me/${negocio.whatsapp}${texto}`
}

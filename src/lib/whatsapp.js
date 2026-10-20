/**
 * Monta o link do WhatsApp, com mensagem opcional já escrita.
 * Retorna null se não houver número, para a interface esconder o botão.
 */
export function linkWhatsApp(numero, mensagem = '') {
  if (!numero) return null
  const texto = mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''
  return `https://wa.me/${numero}${texto}`
}

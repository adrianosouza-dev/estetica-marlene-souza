/*
 * Mensagens de erro para a tela.
 * Erros técnicos (do Supabase, em inglês) nunca aparecem para a Marlene:
 * só as mensagens criadas com erroAmigavel(), já em português.
 */

export const MENSAGEM_PADRAO = 'Não foi possível salvar agora. Confira sua internet e tente de novo.'

/** Cria um erro cuja mensagem pode ser mostrada na tela */
export function erroAmigavel(texto) {
  const erro = new Error(texto)
  erro.amigavel = true
  return erro
}

/** Texto para mostrar: a mensagem amigável ou a padrão */
export function textoDoErro(erro, padrao = MENSAGEM_PADRAO) {
  return erro?.amigavel ? erro.message : padrao
}

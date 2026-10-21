import { useCallback, useState } from 'react'
import { textoDoErro } from '../lib/erros'

/**
 * Executa uma ação de salvar/remover e guarda o retorno para mostrar na tela.
 *   const { ocupado, retorno, executar } = useAcao()
 *   const deuCerto = await executar(() => salvarServico(dados), 'Serviço salvo.')
 * retorno: { tipo: 'sucesso' | 'erro', texto } ou null
 */
export function useAcao() {
  const [ocupado, setOcupado] = useState(false)
  const [retorno, setRetorno] = useState(null)

  const executar = useCallback(async (acao, mensagemSucesso) => {
    setOcupado(true)
    setRetorno(null)
    try {
      await acao()
      if (mensagemSucesso) setRetorno({ tipo: 'sucesso', texto: mensagemSucesso })
      return true
    } catch (erro) {
      console.error(erro)
      setRetorno({ tipo: 'erro', texto: textoDoErro(erro) })
      return false
    } finally {
      setOcupado(false)
    }
  }, [])

  const limpar = useCallback(() => setRetorno(null), [])
  /** Mostra uma mensagem sem executar nada (ex.: depois que um formulário salvou) */
  const avisar = useCallback((texto, tipo = 'sucesso') => setRetorno({ tipo, texto }), [])

  return { ocupado, retorno, executar, limpar, avisar }
}

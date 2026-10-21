import { useEffect } from 'react'

/**
 * Chama "aoVoltar" quando a pessoa volta para esta aba ou aplicativo
 * (ex.: a Marlene responde um WhatsApp e volta para o painel).
 * Assim a agenda mostra os agendamentos novos sem precisar recarregar a página.
 */
export function useAoVoltar(aoVoltar) {
  useEffect(() => {
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === 'visible') aoVoltar()
    }
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    return () => document.removeEventListener('visibilitychange', aoMudarVisibilidade)
  }, [aoVoltar])
}

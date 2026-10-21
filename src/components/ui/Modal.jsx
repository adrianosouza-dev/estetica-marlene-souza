import { useEffect, useId, useRef } from 'react'

/**
 * Janela por cima da página, usando o <dialog> do próprio navegador:
 * ele já prende o foco dentro da janela, fecha com Esc e devolve o foco
 * ao botão que abriu.
 *
 * aberto:   mostra ou esconde
 * aoFechar: chamado ao fechar (Esc, botão "Fechar" ou clique fora)
 */
export function Modal({ aberto, titulo, aoFechar, children }) {
  const dialogo = useRef(null)
  const idTitulo = useId()

  useEffect(() => {
    const el = dialogo.current
    if (aberto && !el.open) el.showModal()
    if (!aberto && el.open) el.close()
  }, [aberto])

  return (
    <dialog
      ref={dialogo}
      className="modal"
      aria-labelledby={idTitulo}
      onClose={aoFechar}
      // Clique no fundo escuro (fora da caixa) fecha
      onClick={(e) => e.target === dialogo.current && aoFechar()}
    >
      <div className="modal__caixa">
        <div className="modal__topo">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="modal__fechar" onClick={aoFechar} aria-label="Fechar">
            ×
          </button>
        </div>
        {aberto && children}
      </div>
    </dialog>
  )
}

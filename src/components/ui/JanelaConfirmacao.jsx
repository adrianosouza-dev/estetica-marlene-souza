import { Modal } from './Modal'

/**
 * Pergunta "tem certeza?" antes de uma ação que não dá para desfazer
 * (remover serviço, folga, foto ou avaliação).
 */
export function JanelaConfirmacao({ aberto, titulo, children, rotuloConfirmar, aoConfirmar, aoFechar }) {
  return (
    <Modal aberto={aberto} titulo={titulo} aoFechar={aoFechar}>
      <div className="janela-confirmacao">{children}</div>
      <div className="modal__acoes">
        <button type="button" className="botao botao--perigo" onClick={aoConfirmar}>
          {rotuloConfirmar}
        </button>
        <button type="button" className="botao botao--secundario" onClick={aoFechar}>
          Voltar
        </button>
      </div>
    </Modal>
  )
}

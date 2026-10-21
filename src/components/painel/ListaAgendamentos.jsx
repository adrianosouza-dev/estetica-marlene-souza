import { useState } from 'react'
import { NOVO_STATUS, separarTimestamp } from '../../lib/agendaAdmin'
import { mudarStatus } from '../../lib/consultasAdmin'
import { formatarDataLonga, formatarMinutos } from '../../lib/formatadores'
import { Aviso } from '../ui/Aviso'
import { Modal } from '../ui/Modal'
import { ItemAgendamento } from './ItemAgendamento'

const primeiroNome = (nome) => nome.trim().split(/\s+/)[0]

const TEXTO_SUCESSO = {
  confirmar: (n) => `Horário de ${n} confirmado.`,
  concluir: (n) => `Atendimento de ${n} concluído.`,
  cancelar: (n) => `Horário de ${n} cancelado. Ele já está livre no site.`,
  reabrir: (n) => `Horário de ${n} reaberto, aguardando confirmação.`,
}

/**
 * Lista de agendamentos com as ações (confirmar, concluir, cancelar, reabrir).
 * Cancelar pede confirmação numa janela. Depois de cada ação, chama aoAlterar
 * para a página buscar os dados de novo.
 */
export function ListaAgendamentos({ agendamentos, agora, mostrarData = false, destacarId, aoAlterar }) {
  const [cancelando, setCancelando] = useState(null)
  const [ocupadoId, setOcupadoId] = useState(null)
  const [retorno, setRetorno] = useState(null) // { tipo, texto }

  async function executar(agendamento, acao) {
    setOcupadoId(agendamento.id)
    setRetorno(null)
    try {
      await mudarStatus(agendamento.id, NOVO_STATUS[acao])
      setRetorno({ tipo: 'sucesso', texto: TEXTO_SUCESSO[acao](primeiroNome(agendamento.cliente_nome)) })
      aoAlterar()
    } catch (erro) {
      console.error(erro)
      let texto = 'Não foi possível alterar agora. Confira sua internet e tente de novo.'
      if (erro.code === '23P01') texto = 'Não dá para reabrir: esse horário já foi ocupado por outro agendamento.'
      else if (!erro.code && erro.message) texto = erro.message // mensagens nossas, já em português
      setRetorno({ tipo: 'erro', texto })
    } finally {
      setOcupadoId(null)
    }
  }

  function agir(agendamento, acao) {
    if (acao === 'cancelar') setCancelando(agendamento)
    else executar(agendamento, acao)
  }

  function confirmarCancelamento() {
    const agendamento = cancelando
    setCancelando(null)
    executar(agendamento, 'cancelar')
  }

  const quando = cancelando && separarTimestamp(cancelando.inicio)

  return (
    <>
      {retorno && <Aviso tipo={retorno.tipo}>{retorno.texto}</Aviso>}

      <ul className="lista-agendamentos" role="list">
        {agendamentos.map((a) => (
          <ItemAgendamento
            key={a.id}
            agendamento={a}
            agora={agora}
            mostrarData={mostrarData}
            destaque={a.id === destacarId}
            ocupado={ocupadoId === a.id}
            aoAgir={agir}
          />
        ))}
      </ul>

      <Modal aberto={Boolean(cancelando)} titulo="Cancelar horário?" aoFechar={() => setCancelando(null)}>
        {cancelando && (
          <>
            <p>
              {cancelando.cliente_nome}, {cancelando.servico?.nome}, {formatarDataLonga(quando.data)} às{' '}
              {formatarMinutos(quando.minutos)}.
            </p>
            <p className="texto-suave">O horário volta a ficar livre no site. Dá para reabrir depois, se ainda estiver livre.</p>
            <div className="modal__acoes">
              <button type="button" className="botao botao--perigo" onClick={confirmarCancelamento}>
                Cancelar horário
              </button>
              <button type="button" className="botao botao--secundario" onClick={() => setCancelando(null)}>
                Manter
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}

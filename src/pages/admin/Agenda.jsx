import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FormNovoAgendamento } from '../../components/painel/FormNovoAgendamento'
import { ListaAgendamentos } from '../../components/painel/ListaAgendamentos'
import { Aviso } from '../../components/ui/Aviso'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { Modal } from '../../components/ui/Modal'
import { useAoVoltar } from '../../hooks/useAoVoltar'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { separarTimestamp } from '../../lib/agendaAdmin'
import { buscarAgendaDoDia, buscarBloqueiosDoDia } from '../../lib/consultasAdmin'
import { agoraEmManaus, somarDias } from '../../lib/disponibilidade'
import { formatarDataLonga, formatarMinutos } from '../../lib/formatadores'

const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/

/** Texto do bloqueio no dia: "Folga (dia inteiro)" ou "Médico, das 14h às 16h" */
function descreverBloqueio(bloqueio, data) {
  const inicio = separarTimestamp(bloqueio.inicio)
  const fim = separarTimestamp(bloqueio.fim)
  const motivo = bloqueio.motivo || 'Sem atendimento'
  const diaInteiro = inicio.data < data || (inicio.minutos === 0 && (fim.data > data || fim.minutos === 0))
  if (diaInteiro) return `${motivo} (dia inteiro)`
  return `${motivo}, das ${formatarMinutos(inicio.minutos)} às ${formatarMinutos(fim.minutos)}`
}

/** Agenda de um dia, com navegação, ações e cadastro de novo agendamento */
export default function Agenda() {
  useTituloPagina('Agenda')
  const [parametros, setParametros] = useSearchParams()
  const [agora, setAgora] = useState(agoraEmManaus)
  const pedido = parametros.get('dia')
  const dia = pedido && DATA_VALIDA.test(pedido) ? pedido : agora.data

  const agenda = useConsulta(buscarAgendaDoDia, dia)
  const bloqueios = useConsulta(buscarBloqueiosDoDia, dia)
  const [mostrarCancelados, setMostrarCancelados] = useState(false)
  const [novoAberto, setNovoAberto] = useState(false)
  const [aviso, setAviso] = useState(null)

  const recarregarAgenda = agenda.recarregar
  const recarregarBloqueios = bloqueios.recarregar
  const recarregar = useCallback(() => {
    recarregarAgenda()
    recarregarBloqueios()
  }, [recarregarAgenda, recarregarBloqueios])

  useAoVoltar(
    useCallback(() => {
      setAgora(agoraEmManaus())
      recarregar()
    }, [recarregar]),
  )

  function irPara(data) {
    setAviso(null)
    setParametros(data === agora.data ? {} : { dia: data })
  }

  const todos = agenda.dados ?? []
  const cancelados = todos.filter((a) => a.status === 'cancelado')
  const visiveis = mostrarCancelados ? todos : todos.filter((a) => a.status !== 'cancelado')

  return (
    <section className="container pagina painel">
      <div className="painel__topo">
        <h1>Agenda</h1>
        <div className="painel__botoes">
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={recarregar}>
            Atualizar
          </button>
          <button type="button" className="botao botao--primario botao--pequeno" onClick={() => setNovoAberto(true)}>
            Novo agendamento
          </button>
        </div>
      </div>

      <nav className="navegador-dia" aria-label="Escolher dia">
        <button type="button" className="navegador-dia__seta" onClick={() => irPara(somarDias(dia, -1))}>
          <span aria-hidden="true">‹</span>
          <span className="sr-only">Dia anterior</span>
        </button>
        <div className="navegador-dia__centro">
          <p className="navegador-dia__data" aria-live="polite">
            {dia === agora.data && <strong>Hoje, </strong>}
            {formatarDataLonga(dia)}
          </p>
          <div className="navegador-dia__extra">
            {dia !== agora.data && (
              <button type="button" className="botao-texto" onClick={() => irPara(agora.data)}>
                Voltar para hoje
              </button>
            )}
            <label className="navegador-dia__escolher">
              <span className="sr-only">Ir para a data</span>
              <input type="date" value={dia} onChange={(e) => e.target.value && irPara(e.target.value)} />
            </label>
          </div>
        </div>
        <button type="button" className="navegador-dia__seta" onClick={() => irPara(somarDias(dia, 1))}>
          <span aria-hidden="true">›</span>
          <span className="sr-only">Próximo dia</span>
        </button>
      </nav>

      {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}

      {bloqueios.dados?.map((b) => (
        <Aviso key={b.id} tipo="info">
          {descreverBloqueio(b, dia)}
        </Aviso>
      ))}

      {/* Ao recarregar o mesmo dia, a lista fica na tela (e as mensagens das ações não somem) */}
      <EstadoConsulta carregando={agenda.carregando && !agenda.dados} erro={agenda.erro}>
        {visiveis.length ? (
          <ListaAgendamentos agendamentos={visiveis} agora={agora} aoAlterar={recarregar} />
        ) : (
          <p className="texto-suave painel__vazio">
            {todos.length ? 'Só há horários cancelados neste dia.' : 'Nenhum agendamento neste dia.'}
          </p>
        )}

        {cancelados.length > 0 && (
          <button type="button" className="botao-texto painel__alternar" onClick={() => setMostrarCancelados((m) => !m)}>
            {mostrarCancelados ? 'Esconder cancelados' : `Mostrar cancelados (${cancelados.length})`}
          </button>
        )}
      </EstadoConsulta>

      <Modal aberto={novoAberto} titulo="Novo agendamento" aoFechar={() => setNovoAberto(false)}>
        <FormNovoAgendamento
          dataInicial={dia}
          aoCancelar={() => setNovoAberto(false)}
          aoCriar={({ data, nome }) => {
            setNovoAberto(false)
            irPara(data)
            setAviso(`Agendamento de ${nome} salvo.`)
            recarregar()
          }}
        />
      </Modal>
    </section>
  )
}

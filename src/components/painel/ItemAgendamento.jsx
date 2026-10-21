import { STATUS, acoesPermitidas, mensagemParaCliente, semBaixa, separarTimestamp, whatsappDaCliente } from '../../lib/agendaAdmin'
import { formatarDataCurta, formatarMinutos, formatarTelefone } from '../../lib/formatadores'
import { linkWhatsApp } from '../../lib/whatsapp'

const ROTULO_ACAO = {
  confirmar: 'Confirmar',
  concluir: 'Concluir',
  cancelar: 'Cancelar',
  reabrir: 'Reabrir',
}

/** Uma linha da agenda: horário, cliente, serviço, status e ações */
export function ItemAgendamento({ agendamento, agora, mostrarData, destaque, ocupado, aoAgir }) {
  const inicio = separarTimestamp(agendamento.inicio)
  const fim = separarTimestamp(agendamento.fim)
  const hora = formatarMinutos(inicio.minutos)
  const numero = whatsappDaCliente(agendamento.cliente_whatsapp)
  const linkZap = numero && linkWhatsApp(numero, mensagemParaCliente(agendamento))
  const esquecido = semBaixa(agendamento, agora)
  const { semana, diaMes } = formatarDataCurta(inicio.data)

  const classes = [
    'agendamento',
    `agendamento--${agendamento.status}`,
    destaque && 'agendamento--destaque',
    esquecido && 'agendamento--sem-baixa',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={classes}>
      <div className="agendamento__hora">
        {mostrarData && (
          <span className="agendamento__data">
            {semana} {diaMes}
          </span>
        )}
        <span className="agendamento__inicio">{hora}</span>
        <span className="agendamento__fim">até {formatarMinutos(fim.minutos)}</span>
      </div>

      <div className="agendamento__info">
        {destaque && <p className="agendamento__selo">Próximo atendimento</p>}
        <p className="agendamento__cliente">{agendamento.cliente_nome}</p>
        <p className="agendamento__servico">{agendamento.servico?.nome ?? 'Serviço removido'}</p>
        {agendamento.observacao && <p className="agendamento__obs">{agendamento.observacao}</p>}

        <p className="agendamento__estado">
          <span className={`status status--${agendamento.status}`}>{STATUS[agendamento.status].rotulo}</span>
          {esquecido && <span className="status status--alerta">Sem baixa</span>}
        </p>

        <div className="agendamento__acoes">
          {linkZap && (
            <a className="botao-acao botao-acao--zap" href={linkZap} target="_blank" rel="noopener noreferrer">
              WhatsApp<span className="sr-only"> de {agendamento.cliente_nome}, {formatarTelefone(numero)}</span>
            </a>
          )}
          {acoesPermitidas(agendamento, agora).map((acao) => (
            <button
              key={acao}
              type="button"
              className={`botao-acao botao-acao--${acao}`}
              disabled={ocupado}
              onClick={() => aoAgir(agendamento, acao)}
            >
              {ROTULO_ACAO[acao]}
              <span className="sr-only">
                {' '}
                horário de {agendamento.cliente_nome} às {hora}
              </span>
            </button>
          ))}
        </div>
      </div>
    </li>
  )
}

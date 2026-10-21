import { formatarDataCurta, formatarDataLonga } from '../../lib/formatadores'

/**
 * Passo 2: faixa com os próximos dias (desliza para o lado no celular).
 * Dias sem atendimento aparecem desativados, com o motivo.
 */
export function PassoDia({ dias, selecionado, aoEscolher }) {
  return (
    <ul className="faixa-dias" role="list" aria-label="Dias disponíveis">
      {dias.map((dia, i) => {
        const { semana, diaMes } = formatarDataCurta(dia.data)
        const rotulo = i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : semana
        const nomeCompleto = formatarDataLonga(dia.data)

        return (
          <li key={dia.data}>
            <button
              type="button"
              className="dia"
              disabled={!dia.disponivel}
              aria-pressed={dia.data === selecionado}
              aria-label={dia.disponivel ? nomeCompleto : `${nomeCompleto}: ${dia.motivo}`}
              onClick={() => aoEscolher(dia.data)}
            >
              <span className="dia__semana">{rotulo}</span>
              <span className="dia__data">{diaMes}</span>
              {!dia.disponivel && <span className="dia__motivo">{dia.motivo}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

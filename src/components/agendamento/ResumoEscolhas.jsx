import { formatarDataLonga, formatarDuracao, formatarMinutos } from '../../lib/formatadores'

/**
 * O que a cliente já escolheu, com "Trocar" para voltar ao passo.
 * Aparece a partir do passo 2.
 */
export function ResumoEscolhas({ servico, data, minutos, aoTrocar }) {
  const linhas = [
    servico && { passo: 1, rotulo: 'Serviço', valor: `${servico.nome}, ${formatarDuracao(servico.duracao_minutos)}` },
    data && { passo: 2, rotulo: 'Dia', valor: formatarDataLonga(data) },
    minutos != null && { passo: 3, rotulo: 'Horário', valor: formatarMinutos(minutos) },
  ].filter(Boolean)

  if (!linhas.length) return null

  return (
    <dl className="resumo">
      {linhas.map((l) => (
        <div key={l.rotulo} className="resumo__linha">
          <dt>{l.rotulo}</dt>
          <dd>{l.valor}</dd>
          <dd>
            <button type="button" className="botao-texto" onClick={() => aoTrocar(l.passo)}>
              Trocar<span className="sr-only"> {l.rotulo.toLowerCase()}</span>
            </button>
          </dd>
        </div>
      ))}
    </dl>
  )
}

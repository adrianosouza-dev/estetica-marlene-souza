import { formatarDuracao, formatarPreco } from '../../lib/formatadores'

/** Passo 1: lista de serviços; um toque escolhe e avança */
export function PassoServico({ servicos, selecionadoId, aoEscolher }) {
  return (
    <ul className="opcoes-servico" role="list">
      {servicos.map((s) => (
        <li key={s.id}>
          <button
            type="button"
            className="opcao-servico"
            aria-pressed={s.id === selecionadoId}
            onClick={() => aoEscolher(s.id)}
          >
            <span className="opcao-servico__nome">{s.nome}</span>
            <span className="opcao-servico__detalhe">{formatarDuracao(s.duracao_minutos)}</span>
            <span className="opcao-servico__preco">{formatarPreco(s.preco)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

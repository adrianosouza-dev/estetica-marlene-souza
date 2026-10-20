import { Estrelas } from '../ui/Estrelas'

const formatoData = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

/** Avaliações aprovadas, mostradas como citações */
export function ListaAvaliacoes({ avaliacoes }) {
  return (
    <ul className="avaliacoes" role="list">
      {avaliacoes.map((a) => (
        <li key={a.id} className="avaliacao">
          <figure>
            <Estrelas nota={a.nota} />
            {a.comentario && (
              <blockquote className="avaliacao__texto">
                <p>{a.comentario}</p>
              </blockquote>
            )}
            <figcaption className="avaliacao__autora">
              {a.nome}
              <span className="texto-suave">, {formatoData.format(new Date(a.criado_em))}</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  )
}

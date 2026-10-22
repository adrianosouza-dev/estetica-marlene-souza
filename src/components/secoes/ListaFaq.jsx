/**
 * Perguntas em acordeão com <details>/<summary>: abre e fecha com mouse,
 * toque ou teclado (Enter/Espaço), sem JavaScript, e o leitor de tela já
 * anuncia se está aberto ou fechado.
 */
export function ListaFaq({ perguntas }) {
  return (
    <div className="faq">
      {perguntas.map(({ id, pergunta, resposta }) => (
        <details key={id ?? pergunta} className="faq__item">
          <summary className="faq__pergunta">{pergunta}</summary>
          <p className="faq__resposta">{resposta}</p>
        </details>
      ))}
    </div>
  )
}

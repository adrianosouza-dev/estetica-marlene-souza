/**
 * Mostra uma nota de 1 a 5 em estrelas.
 * Para o leitor de tela, anuncia "Nota 4 de 5" em vez de ler cada estrela.
 */
export function Estrelas({ nota }) {
  return (
    <span className="estrelas" role="img" aria-label={`Nota ${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= nota ? 'estrelas__cheia' : 'estrelas__vazia'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 3.
export default function Avaliar() {
  useTituloPagina('Deixe sua avaliação')

  return (
    <section className="container pagina">
      <h1>Deixe sua avaliação</h1>
      <p className="texto-suave">Conte como foi o seu atendimento.</p>
    </section>
  )
}

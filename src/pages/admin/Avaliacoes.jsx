import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 7.
export default function Avaliacoes() {
  useTituloPagina('Avaliações')

  return (
    <section className="container pagina">
      <h1>Avaliações</h1>
      <p className="texto-suave">Aprove ou remova avaliações das clientes.</p>
    </section>
  )
}

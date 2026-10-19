import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 7.
export default function Fotos() {
  useTituloPagina('Fotos')

  return (
    <section className="container pagina">
      <h1>Fotos</h1>
      <p className="texto-suave">Envie, legende e remova fotos da galeria.</p>
    </section>
  )
}

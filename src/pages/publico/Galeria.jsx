import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 3.
export default function Galeria() {
  useTituloPagina('Galeria')

  return (
    <section className="container pagina">
      <h1>Galeria</h1>
      <p className="texto-suave">Alguns trabalhos feitos pela Marlene.</p>
    </section>
  )
}

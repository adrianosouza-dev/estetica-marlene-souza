import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 3.
export default function Perguntas() {
  useTituloPagina('Dúvidas frequentes')

  return (
    <section className="container pagina">
      <h1>Dúvidas frequentes</h1>
      <p className="texto-suave">Respostas para as perguntas mais comuns.</p>
    </section>
  )
}

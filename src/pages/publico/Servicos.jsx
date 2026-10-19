import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 3.
export default function Servicos() {
  useTituloPagina('Serviços e preços')

  return (
    <section className="container pagina">
      <h1>Serviços e preços</h1>
      <p className="texto-suave">Manicure, pedicure e design de sobrancelhas.</p>
    </section>
  )
}

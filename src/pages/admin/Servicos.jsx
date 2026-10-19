import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 7.
export default function Servicos() {
  useTituloPagina('Serviços')

  return (
    <section className="container pagina">
      <h1>Serviços</h1>
      <p className="texto-suave">Cadastre e edite serviços, preços e durações.</p>
    </section>
  )
}

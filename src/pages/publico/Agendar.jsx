import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 4.
export default function Agendar() {
  useTituloPagina('Agendar horário')

  return (
    <section className="container pagina">
      <h1>Agendar horário</h1>
      <p className="texto-suave">Escolha o serviço, o dia e o horário que ficam melhor para você.</p>
    </section>
  )
}

import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 6.
export default function Dashboard() {
  useTituloPagina('Painel')

  return (
    <section className="container pagina">
      <h1>Painel</h1>
      <p className="texto-suave">Resumo do dia, próximos horários e avaliações pendentes.</p>
    </section>
  )
}

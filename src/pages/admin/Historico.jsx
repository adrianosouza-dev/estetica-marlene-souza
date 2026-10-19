import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 6.
export default function Historico() {
  useTituloPagina('Histórico')

  return (
    <section className="container pagina">
      <h1>Histórico</h1>
      <p className="texto-suave">Agendamentos passados, com filtro por período e por cliente.</p>
    </section>
  )
}

import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 6.
export default function Agenda() {
  useTituloPagina('Agenda')

  return (
    <section className="container pagina">
      <h1>Agenda</h1>
      <p className="texto-suave">Agendamentos do dia, com opção de confirmar, concluir ou cancelar.</p>
    </section>
  )
}

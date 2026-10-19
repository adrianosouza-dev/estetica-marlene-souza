import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 7.
export default function Horarios() {
  useTituloPagina('Horários')

  return (
    <section className="container pagina">
      <h1>Horários</h1>
      <p className="texto-suave">Funcionamento por dia da semana, almoço, folgas e feriados.</p>
    </section>
  )
}

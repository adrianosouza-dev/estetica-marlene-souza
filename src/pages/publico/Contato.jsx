import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 3.
export default function Contato() {
  useTituloPagina('Contato e localização')

  return (
    <section className="container pagina">
      <h1>Contato e localização</h1>
      <p className="texto-suave">Endereço, WhatsApp e horário de funcionamento.</p>
    </section>
  )
}

import { Botao } from '../../components/ui/Botao'
import { useTituloPagina } from '../../hooks/useTituloPagina'

// Versão provisória. Frase de impacto, guaraná em SVG, fotos, avaliações e FAQ na Fase 3.
export default function Inicio() {
  useTituloPagina()

  return (
    <section className="container pagina">
      <h1>Unhas e sobrancelhas feitas com calma e capricho</h1>
      <p className="texto-suave">Atendimento com hora marcada em Maués-AM.</p>
      <Botao para="/agendar">Agendar meu horário</Botao>
    </section>
  )
}

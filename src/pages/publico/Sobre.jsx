import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 3.
export default function Sobre() {
  useTituloPagina('Sobre a Marlene')

  return (
    <section className="container pagina">
      <h1>Sobre a Marlene</h1>
      <p className="texto-suave">Um pouco sobre quem cuida das suas unhas e sobrancelhas.</p>
    </section>
  )
}

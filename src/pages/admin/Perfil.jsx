import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 7.
export default function Perfil() {
  useTituloPagina('Perfil')

  return (
    <section className="container pagina">
      <h1>Perfil</h1>
      <p className="texto-suave">Texto do Sobre e dados de contato.</p>
    </section>
  )
}

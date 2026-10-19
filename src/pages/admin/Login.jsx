import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 5.
export default function Login() {
  useTituloPagina('Entrar no painel')

  return (
    <section className="container pagina">
      <h1>Entrar no painel</h1>
      <p className="texto-suave">Acesso exclusivo da profissional.</p>
    </section>
  )
}

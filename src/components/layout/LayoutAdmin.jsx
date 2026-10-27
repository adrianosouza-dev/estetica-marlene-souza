import { Suspense, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { sair } from '../../lib/auth'
import { FaixaDemonstracao } from './FaixaDemonstracao'

const LINKS = [
  { para: '/admin', rotulo: 'Início' },
  { para: '/admin/agenda', rotulo: 'Agenda' },
  { para: '/admin/historico', rotulo: 'Histórico' },
  { para: '/admin/servicos', rotulo: 'Serviços' },
  { para: '/admin/horarios', rotulo: 'Horários' },
  { para: '/admin/fotos', rotulo: 'Fotos' },
  { para: '/admin/avaliacoes', rotulo: 'Avaliações' },
  { para: '/admin/perguntas', rotulo: 'Dúvidas' },
  { para: '/admin/certificados', rotulo: 'Certificados' },
  { para: '/admin/perfil', rotulo: 'Perfil' },
]

export function LayoutAdmin() {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [saindo, setSaindo] = useState(false)

  async function aoSair() {
    setSaindo(true)
    try {
      await sair()
    } catch (erro) {
      console.error(erro) // mesmo com erro, a sessão local é apagada pelo Supabase
    }
    navegar('/admin/login', { replace: true })
  }

  return (
    <div className="layout">
      <a href="#conteudo" className="pular-conteudo">
        Pular para o conteúdo
      </a>
      <FaixaDemonstracao />

      <header className="admin__topo">
        <div className="container admin__barra">
          <Link to="/admin" className="admin__marca">
            Painel da Marlene
          </Link>
          <div className="admin__conta">
            <span className="admin__email">{usuario?.email}</span>
            <Link to="/">Ver site</Link>
            <button type="button" className="admin__sair" onClick={aoSair} disabled={saindo}>
              {saindo ? 'Saindo…' : 'Sair'}
            </button>
          </div>
        </div>
      </header>

      <nav className="admin__nav" aria-label="Painel">
        <ul className="container admin__nav-lista" role="list">
          {LINKS.map((link) => (
            <li key={link.para}>
              <NavLink to={link.para} end className="admin__nav-link">
                {link.rotulo}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main id="conteudo" className="layout__conteudo" tabIndex={-1}>
        <Suspense fallback={<p className="carregando container">Carregando…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

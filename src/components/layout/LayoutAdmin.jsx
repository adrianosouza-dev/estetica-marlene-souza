import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { negocio } from '../../config/negocio'

const LINKS = [
  { para: '/admin', rotulo: 'Início' },
  { para: '/admin/agenda', rotulo: 'Agenda' },
  { para: '/admin/historico', rotulo: 'Histórico' },
  { para: '/admin/servicos', rotulo: 'Serviços' },
  { para: '/admin/horarios', rotulo: 'Horários' },
  { para: '/admin/fotos', rotulo: 'Fotos' },
  { para: '/admin/avaliacoes', rotulo: 'Avaliações' },
  { para: '/admin/perfil', rotulo: 'Perfil' },
]

export function LayoutAdmin() {
  return (
    <div className="layout">
      <a href="#conteudo" className="pular-conteudo">
        Pular para o conteúdo
      </a>

      <header className="admin__topo">
        <div className="container admin__barra">
          <Link to="/admin" className="admin__marca">
            Painel · {negocio.nome}
          </Link>
          <Link to="/">Ver site</Link>
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
        <Suspense fallback={<p className="carregando">Carregando…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

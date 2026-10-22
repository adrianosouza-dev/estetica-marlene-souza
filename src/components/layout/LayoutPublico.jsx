import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { negocio } from '../../config/negocio'
import { Botao } from '../ui/Botao'
import { FaixaDemonstracao } from './FaixaDemonstracao'
import { ProvedorNegocio } from './ProvedorNegocio'
import { Rodape } from './Rodape'

const LINKS = [
  { para: '/', rotulo: 'Início' },
  { para: '/servicos', rotulo: 'Serviços e preços' },
  { para: '/galeria', rotulo: 'Galeria' },
  { para: '/sobre', rotulo: 'Sobre' },
  { para: '/perguntas', rotulo: 'Dúvidas' },
  { para: '/contato', rotulo: 'Contato' },
]

export function LayoutPublico() {
  const { pathname } = useLocation()

  // Guarda em qual página o menu foi aberto: ao navegar, ele fecha sozinho
  const [menuAbertoEm, setMenuAbertoEm] = useState(null)
  const menuAberto = menuAbertoEm === pathname
  const setMenuAberto = (aberto) => setMenuAbertoEm(aberto ? pathname : null)

  // Ao trocar de página, volta ao topo
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Tecla Esc fecha o menu do celular
  useEffect(() => {
    if (!menuAberto) return
    const aoApertarTecla = (evento) => evento.key === 'Escape' && setMenuAbertoEm(null)
    document.addEventListener('keydown', aoApertarTecla)
    return () => document.removeEventListener('keydown', aoApertarTecla)
  }, [menuAberto])

  return (
    <ProvedorNegocio>
      <div className="layout">
        <a href="#conteudo" className="pular-conteudo">
          Pular para o conteúdo
        </a>
        <FaixaDemonstracao />

        <header className="cabecalho">
          <div className="container">
            <div className="cabecalho__barra">
              <Link to="/" className="marca">
                {negocio.nome}
                <span>{negocio.especialidade}</span>
              </Link>

              <nav
                id="menu-principal"
                className={`menu ${menuAberto ? 'menu--aberto' : ''}`}
                aria-label="Principal"
              >
                <ul className="menu__lista" role="list">
                  {LINKS.map((link) => (
                    <li key={link.para}>
                      <NavLink to={link.para} end className="menu__link">
                        {link.rotulo}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="cabecalho__acoes">
                <Botao para="/agendar">Agendar</Botao>
                <button
                  type="button"
                  className="botao-menu"
                  aria-expanded={menuAberto}
                  aria-controls="menu-principal"
                  onClick={() => setMenuAberto(!menuAberto)}
                >
                  <span className="botao-menu__icone" aria-hidden="true" />
                  <span className="botao-menu__texto">Menu</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main id="conteudo" className="layout__conteudo" tabIndex={-1}>
          <Outlet />
        </main>

        <Rodape />
      </div>
    </ProvedorNegocio>
  )
}

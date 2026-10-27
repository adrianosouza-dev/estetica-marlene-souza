import { Link } from 'react-router-dom'
import { useNegocio } from '../../hooks/useNegocio'
import { linkWhatsApp } from '../../lib/whatsapp'
import { ItensRedes } from '../ui/ItensRedes'

const ano = new Date().getFullYear()

export function Rodape() {
  const { nome, especialidade, endereco, horarioResumo, whatsapp, instagram, tiktok, facebook } = useNegocio()
  const linkZap = linkWhatsApp(whatsapp, 'Olá, Marlene! Vim pelo site.')

  return (
    <footer className="rodape">
      <div className="container">
        <div className="rodape__grade">
          <div>
            <p className="rodape__marca">{nome}</p>
            <p>{especialidade}</p>
            <address>{endereco}</address>
            <p>{horarioResumo}</p>
          </div>

          <div>
            <h2 className="rodape__titulo">Contato</h2>
            <ul className="rodape__lista" role="list">
              {linkZap && (
                <li>
                  <a href={linkZap} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </li>
              )}
              <ItensRedes instagram={instagram} tiktok={tiktok} facebook={facebook} />
              <li>
                <Link to="/contato">Como chegar</Link>
              </li>
            </ul>
          </div>

          <nav aria-label="Links rápidos">
            <h2 className="rodape__titulo">Links rápidos</h2>
            <ul className="rodape__lista" role="list">
              <li>
                <Link to="/servicos">Serviços</Link>
              </li>
              <li>
                <Link to="/agendar">Agendar</Link>
              </li>
              <li>
                <Link to="/perguntas">Dúvidas frequentes</Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className="rodape__base">
          © {ano} {nome}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}

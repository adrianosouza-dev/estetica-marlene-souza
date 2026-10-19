import { Link } from 'react-router-dom'
import { enderecoCompleto, negocio } from '../../config/negocio'
import { linkWhatsApp } from '../../lib/whatsapp'

const ano = new Date().getFullYear()

export function Rodape() {
  const whatsapp = linkWhatsApp()

  return (
    <footer className="rodape">
      <div className="container">
        <div className="rodape__grade">
          <div>
            <p className="rodape__marca">{negocio.nome}</p>
            <p>{negocio.especialidade}</p>
            <address>{enderecoCompleto()}</address>
            <p>{negocio.horarioResumo}</p>
          </div>

          <div>
            <h2 className="rodape__titulo">Fale comigo</h2>
            <ul className="rodape__lista" role="list">
              {whatsapp && (
                <li>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </li>
              )}
              {negocio.instagram && (
                <li>
                  <a
                    href={`https://instagram.com/${negocio.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                </li>
              )}
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
          © {ano} {negocio.nome}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}

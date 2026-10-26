import { Link } from 'react-router-dom'
import { ListaAvaliacoes } from '../../components/secoes/ListaAvaliacoes'
import { ListaFaq } from '../../components/secoes/ListaFaq'
import { Botao } from '../../components/ui/Botao'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { Guarana } from '../../components/ui/Guarana'
import { useConsulta } from '../../hooks/useConsulta'
import { useNegocio } from '../../hooks/useNegocio'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarAvaliacoesAprovadas, buscarFotos, buscarPerguntas } from '../../lib/consultas'

const QTD_FOTOS = 4
const QTD_AVALIACOES = 4
const QTD_PERGUNTAS = 3

export default function Inicio() {
  useTituloPagina()
  const negocio = useNegocio()
  const fotos = useConsulta(buscarFotos, QTD_FOTOS)
  const avaliacoes = useConsulta(buscarAvaliacoesAprovadas, QTD_AVALIACOES)
  const perguntas = useConsulta(buscarPerguntas, QTD_PERGUNTAS)

  return (
    <>
      <section className="abertura">
        <div className="container abertura__grade">
          <Guarana className="abertura__guarana" />
          <div className="abertura__texto">
            <h1 className="abertura__titulo">{negocio.frase}</h1>
            <p className="abertura__descricao">{negocio.descricao}</p>
            <div className="abertura__acoes">
              <Botao para="/agendar">Agendar meu horário</Botao>
              <Link to="/servicos" className="link-simples">
                Ver serviços e preços
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="secao" aria-labelledby="titulo-trabalhos">
        <div className="container">
          <div className="secao__topo">
            <h2 id="titulo-trabalhos">Trabalhos recentes</h2>
            <Link to="/galeria" className="link-simples">
              Ver galeria completa
            </Link>
          </div>
          <EstadoConsulta
            carregando={fotos.carregando}
            erro={fotos.erro}
            vazio={!fotos.dados?.length}
            mensagemVazio="As fotos dos trabalhos aparecem aqui em breve."
          >
            {/* tabIndex: no celular a faixa rola para o lado, e assim também rola pelo teclado */}
            <ul className="faixa-fotos" role="list" tabIndex={0} aria-label="Fotos de trabalhos recentes">
              {fotos.dados?.map((foto) => (
                <li key={foto.id} className="faixa-fotos__item">
                  <img
                    src={foto.url}
                    alt={foto.legenda || 'Trabalho feito pela Marlene'}
                    width="360"
                    height="600"
                    loading="lazy"
                    decoding="async"
                  />
                </li>
              ))}
            </ul>
          </EstadoConsulta>
        </div>
      </section>

      <section className="secao secao--avaliacoes" aria-labelledby="titulo-avaliacoes">
        <div className="container">
          <div className="secao__topo">
            <h2 id="titulo-avaliacoes">Quem já passou por aqui</h2>
            <Link to="/avaliar" className="link-simples">
              Deixar minha avaliação
            </Link>
          </div>
          <EstadoConsulta
            carregando={avaliacoes.carregando}
            erro={avaliacoes.erro}
            vazio={!avaliacoes.dados?.length}
            mensagemVazio="Ainda não há avaliações publicadas. Já foi atendida pela Marlene? Conte como foi."
          >
            <ListaAvaliacoes avaliacoes={avaliacoes.dados ?? []} />
          </EstadoConsulta>
        </div>
      </section>

      {/* Resumo das dúvidas: só aparece quando há perguntas cadastradas no painel */}
      {perguntas.dados?.length > 0 && (
        <section className="secao" aria-labelledby="titulo-duvidas">
          <div className="container secao--estreita">
            <div className="secao__topo">
              <h2 id="titulo-duvidas">Dúvidas frequentes</h2>
              <Link to="/perguntas" className="link-simples">
                Ver todas as dúvidas
              </Link>
            </div>
            <ListaFaq perguntas={perguntas.dados} />
          </div>
        </section>
      )}
    </>
  )
}

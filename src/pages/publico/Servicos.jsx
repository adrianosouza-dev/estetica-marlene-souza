import { Link } from 'react-router-dom'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarServicosAtivos } from '../../lib/consultas'
import { formatarDuracao, formatarPreco } from '../../lib/formatadores'

export default function Servicos() {
  useTituloPagina('Serviços e preços')
  const { dados: servicos, carregando, erro } = useConsulta(buscarServicosAtivos)

  return (
    <section className="container pagina secao--estreita">
      <h1>Serviços e preços</h1>
      <p className="texto-suave">
        O tempo indicado é o máximo de cada atendimento: ele fica reservado só para você.
      </p>

      <EstadoConsulta
        carregando={carregando}
        erro={erro}
        vazio={!servicos?.length}
        mensagemVazio="Nenhum serviço disponível no momento."
      >
        <ul className="cardapio" role="list">
          {servicos?.map((s) => (
            <li key={s.id} className="cardapio__item">
              <div className="cardapio__linha">
                <h2 className="cardapio__nome">{s.nome}</h2>
                <span className="cardapio__pontos" aria-hidden="true" />
                <span className="cardapio__preco">{formatarPreco(s.preco)}</span>
              </div>
              <p className="cardapio__duracao">{formatarDuracao(s.duracao_minutos)}</p>
              {s.descricao && <p className="cardapio__descricao">{s.descricao}</p>}
              <Link to={`/agendar?servico=${s.id}`} className="link-simples">
                Agendar {s.nome.toLowerCase()}
              </Link>
            </li>
          ))}
        </ul>
      </EstadoConsulta>
    </section>
  )
}

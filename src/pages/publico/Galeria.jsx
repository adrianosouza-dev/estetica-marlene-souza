import { Botao } from '../../components/ui/Botao'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarFotos } from '../../lib/consultas'

export default function Galeria() {
  useTituloPagina('Galeria')
  const { dados: fotos, carregando, erro } = useConsulta(buscarFotos)

  return (
    <section className="container pagina">
      <h1>Galeria</h1>
      <p className="texto-suave">Trabalhos feitos pela Marlene.</p>

      <EstadoConsulta
        carregando={carregando}
        erro={erro}
        vazio={!fotos?.length}
        mensagemVazio="As fotos dos trabalhos aparecem aqui em breve."
      >
        <ul className="galeria" role="list">
          {fotos?.map((foto) => (
            <li key={foto.id}>
              <figure className="galeria__item">
                <img
                  src={foto.url}
                  alt={foto.legenda || 'Trabalho feito pela Marlene'}
                  loading="lazy"
                  decoding="async"
                />
                {foto.legenda && <figcaption>{foto.legenda}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      </EstadoConsulta>

      <Botao para="/agendar">Agendar meu horário</Botao>
    </section>
  )
}

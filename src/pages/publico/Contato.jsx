import { Botao } from '../../components/ui/Botao'
import { useNegocio } from '../../hooks/useNegocio'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import {
  descreverHorarioDia,
  enderecoSemQuebra,
  formatarTelefone,
  nomeDoDia,
  ordenarSemana,
} from '../../lib/formatadores'
import { linkWhatsApp } from '../../lib/whatsapp'

export default function Contato() {
  useTituloPagina('Contato e localização')
  const { endereco, linkMapa, whatsapp, instagram, horarios, horarioResumo } = useNegocio()
  const linkZap = linkWhatsApp(whatsapp, 'Olá, Marlene! Vim pelo site.')
  const semana = ordenarSemana(horarios)

  return (
    <section className="container pagina contato">
      <h1>Contato e localização</h1>

      <div className="contato__grade">
        <div className="contato__bloco">
          <h2>Onde fica</h2>
          <address className="contato__endereco">{enderecoSemQuebra(endereco)}</address>
          <Botao href={linkMapa} variante="secundario">
            Abrir no mapa
          </Botao>
        </div>

        <div className="contato__bloco">
          <h2>Fale com a Marlene</h2>
          {linkZap ? (
            <>
              <p className="contato__telefone">{formatarTelefone(whatsapp)}</p>
              <Botao href={linkZap}>Chamar no WhatsApp</Botao>
            </>
          ) : (
            <p className="texto-suave">O número do WhatsApp será publicado em breve.</p>
          )}
          {instagram && (
            <p>
              <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer">
                Instagram @{instagram}
              </a>
            </p>
          )}
        </div>
      </div>

      <div className="contato__bloco">
        <h2>Horário de atendimento</h2>
        {semana.length ? (
          <table className="horarios">
            <caption className="sr-only">Horário de atendimento por dia da semana</caption>
            <tbody>
              {semana.map((h) => (
                <tr key={h.dia_semana} className={h.aberto ? '' : 'horarios--fechado'}>
                  <th scope="row">{nomeDoDia(h.dia_semana)}</th>
                  <td>{descreverHorarioDia(h)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>{horarioResumo}</p>
        )}
      </div>
    </section>
  )
}

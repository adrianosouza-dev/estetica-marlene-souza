import { Botao } from '../../components/ui/Botao'
import { useNegocio } from '../../hooks/useNegocio'
import { useTituloPagina } from '../../hooks/useTituloPagina'

export default function Sobre() {
  useTituloPagina('Sobre a Marlene')
  const { sobre, fotoUrl, nome, carregando } = useNegocio()

  // O texto vem do painel; uma linha em branco separa parágrafos
  const paragrafos = sobre
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <section className="container pagina sobre">
      {fotoUrl && (
        <img className="sobre__foto" src={fotoUrl} alt={`Foto de ${nome}`} width="800" height="1067" />
      )}

      <div className="sobre__texto">
        <h1>Sobre a Marlene</h1>
        {carregando ? (
          <p className="carregando" role="status">
            Carregando…
          </p>
        ) : paragrafos.length ? (
          paragrafos.map((p) => <p key={p}>{p}</p>)
        ) : (
          <p>A Marlene atende unhas e sobrancelhas em Maués, com hora marcada.</p>
        )}
        <Botao para="/agendar">Agendar meu horário</Botao>
      </div>
    </section>
  )
}

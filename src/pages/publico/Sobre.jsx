import { Botao } from '../../components/ui/Botao'
import { useConsulta } from '../../hooks/useConsulta'
import { useNegocio } from '../../hooks/useNegocio'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarCertificados } from '../../lib/consultas'

/**
 * Certificados e cursos cadastrados no painel.
 * Sem nenhum (ou se a busca falhar), a seção some e o resto da página continua igual.
 */
function SecaoCertificados() {
  const { dados: certificados } = useConsulta(buscarCertificados)
  if (!certificados?.length) return null

  return (
    <section className="container certificados" aria-labelledby="titulo-certificados">
      <h2 id="titulo-certificados">Certificados e cursos</h2>
      <ul className="certificados__lista" role="list">
        {certificados.map((c) => (
          <li key={c.id} className="certificado">
            {c.imagem_url && (
              <a className="certificado__imagem" href={c.imagem_url} target="_blank" rel="noopener noreferrer">
                <img src={c.imagem_url} alt="" width="160" height="120" loading="lazy" decoding="async" />
                <span className="sr-only">Ver o certificado de {c.titulo} (abre a imagem)</span>
              </a>
            )}
            <div>
              <h3 className="certificado__titulo">{c.titulo}</h3>
              <p className="certificado__detalhe">
                {c.instituicao}
                {c.ano ? `, ${c.ano}` : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Sobre() {
  useTituloPagina('Sobre a Marlene')
  const { sobre, fotoUrl, nome, carregando } = useNegocio()

  // O texto vem do painel; uma linha em branco separa parágrafos
  const paragrafos = sobre
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <>
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

      <SecaoCertificados />
    </>
  )
}

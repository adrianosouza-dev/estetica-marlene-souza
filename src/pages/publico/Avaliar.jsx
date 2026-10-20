import { useState } from 'react'
import { Aviso } from '../../components/ui/Aviso'
import { Botao } from '../../components/ui/Botao'
import { Campo } from '../../components/ui/Campo'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { enviarAvaliacao } from '../../lib/consultas'

const LIMITE_COMENTARIO = 600
const ROTULOS_NOTA = ['Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente']

function validar({ nome, nota, comentario }) {
  const erros = {}
  if (nome.trim().length < 2) erros.nome = 'Escreva seu nome (pode ser só o primeiro).'
  if (nome.trim().length > 60) erros.nome = 'Use no máximo 60 letras.'
  if (!nota) erros.nota = 'Escolha uma nota de 1 a 5.'
  if (comentario.length > LIMITE_COMENTARIO) erros.comentario = `Use no máximo ${LIMITE_COMENTARIO} caracteres.`
  return erros
}

export default function Avaliar() {
  useTituloPagina('Deixe sua avaliação')
  const [dados, setDados] = useState({ nome: '', nota: 0, comentario: '', site: '' })
  const [erros, setErros] = useState({})
  const [situacao, setSituacao] = useState('preenchendo') // preenchendo | enviando | enviada | falhou

  const alterar = (campo) => (evento) => setDados((d) => ({ ...d, [campo]: evento.target.value }))

  async function aoEnviar(evento) {
    evento.preventDefault()
    const encontrados = validar(dados)
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    // Campo "site" é invisível para pessoas; só robôs o preenchem.
    // Fingimos sucesso para o robô não tentar de novo.
    if (dados.site) {
      setSituacao('enviada')
      return
    }

    setSituacao('enviando')
    try {
      await enviarAvaliacao(dados)
      setSituacao('enviada')
    } catch (erro) {
      console.error(erro)
      setSituacao('falhou')
    }
  }

  if (situacao === 'enviada') {
    return (
      <section className="container pagina secao--estreita">
        <h1>Obrigada pela avaliação!</h1>
        <Aviso tipo="sucesso">Ela aparece no site depois que a Marlene aprovar.</Aviso>
        <Botao para="/" variante="secundario">
          Voltar para o início
        </Botao>
      </section>
    )
  }

  return (
    <section className="container pagina secao--estreita">
      <h1>Deixe sua avaliação</h1>
      <p className="texto-suave">Conte como foi o seu atendimento. Sua opinião ajuda outras clientes.</p>

      <form className="formulario" onSubmit={aoEnviar} noValidate>
        <Campo
          rotulo="Seu nome"
          dica="Aparece junto com a avaliação."
          value={dados.nome}
          onChange={alterar('nome')}
          erro={erros.nome}
          autoComplete="given-name"
          maxLength={60}
          required
        />

        <fieldset className={`nota ${erros.nota ? 'campo--erro' : ''}`} aria-describedby={erros.nota ? 'erro-nota' : undefined}>
          <legend className="campo__rotulo">Sua nota</legend>
          <div className="nota__opcoes">
            {ROTULOS_NOTA.map((rotulo, i) => {
              const valor = i + 1
              return (
                <span key={valor} className="nota__opcao">
                  <input
                    type="radio"
                    id={`nota-${valor}`}
                    name="nota"
                    value={valor}
                    className="sr-only"
                    checked={dados.nota === valor}
                    onChange={() => setDados((d) => ({ ...d, nota: valor }))}
                  />
                  <label
                    htmlFor={`nota-${valor}`}
                    className={`nota__estrela ${valor <= dados.nota ? 'nota__estrela--ativa' : ''}`}
                  >
                    {/* Estrela cheia até a nota escolhida, vazada depois: não depende só da cor */}
                    <span aria-hidden="true">{valor <= dados.nota ? '★' : '☆'}</span>
                    <span className="sr-only">
                      {valor} {valor === 1 ? 'estrela' : 'estrelas'}, {rotulo}
                    </span>
                  </label>
                </span>
              )
            })}
          </div>
          <p className="nota__rotulo" aria-hidden="true">
            {dados.nota ? ROTULOS_NOTA[dados.nota - 1] : ' '}
          </p>
          {erros.nota && (
            <p id="erro-nota" className="campo__erro">
              {erros.nota}
            </p>
          )}
        </fieldset>

        <Campo
          rotulo="Comentário"
          opcional
          multilinha
          rows={4}
          value={dados.comentario}
          onChange={alterar('comentario')}
          erro={erros.comentario}
          maxLength={LIMITE_COMENTARIO}
          dica={`${dados.comentario.length} de ${LIMITE_COMENTARIO} caracteres`}
        />

        {/* Armadilha para robôs: escondida de pessoas e de leitores de tela */}
        <div className="armadilha" aria-hidden="true">
          <label htmlFor="site">Não preencha este campo</label>
          <input id="site" name="site" tabIndex={-1} autoComplete="off" value={dados.site} onChange={alterar('site')} />
        </div>

        {situacao === 'falhou' && (
          <Aviso tipo="erro">Não foi possível enviar agora. Confira sua internet e tente de novo.</Aviso>
        )}

        <Botao type="submit" disabled={situacao === 'enviando'}>
          {situacao === 'enviando' ? 'Enviando…' : 'Enviar avaliação'}
        </Botao>
      </form>
    </section>
  )
}

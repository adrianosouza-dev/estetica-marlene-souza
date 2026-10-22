import { useState } from 'react'
import { EnviarFoto } from '../../components/painel/EnviarFoto'
import { Aviso } from '../../components/ui/Aviso'
import { Botao } from '../../components/ui/Botao'
import { Campo } from '../../components/ui/Campo'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { JanelaConfirmacao } from '../../components/ui/JanelaConfirmacao'
import { Modal } from '../../components/ui/Modal'
import { MODO_DEMO } from '../../config/demo'
import { useAcao } from '../../hooks/useAcao'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarFotosAdmin, enviarFoto, removerFoto, salvarLegenda, trocarOrdem } from '../../lib/consultasCadastros'

/** Fotos da galeria: enviar, legenda, ordem e remoção */
export default function Fotos() {
  useTituloPagina('Fotos')
  const fotos = useConsulta(buscarFotosAdmin)
  const { ocupado, retorno, executar, avisar } = useAcao()
  const [enviando, setEnviando] = useState(false)
  const [editando, setEditando] = useState(null) // { foto, legenda }
  const [removendo, setRemovendo] = useState(null)

  const lista = fotos.dados ?? []
  const menorOrdem = lista.length ? Math.min(...lista.map((f) => f.ordem)) : 1

  async function mover(indice, direcao) {
    const ok = await executar(() => trocarOrdem('fotos', lista[indice], lista[indice + direcao]))
    if (ok) fotos.recarregar()
  }

  async function salvarEdicao(evento) {
    evento.preventDefault()
    const { foto, legenda } = editando
    setEditando(null)
    const ok = await executar(() => salvarLegenda(foto.id, legenda), 'Legenda salva.')
    if (ok) fotos.recarregar()
  }

  async function confirmarRemocao() {
    const foto = removendo
    setRemovendo(null)
    const ok = await executar(() => removerFoto(foto), 'Foto removida da galeria.')
    if (ok) fotos.recarregar()
  }

  return (
    <section className="container pagina painel">
      <div className="painel__topo">
        <h1>Fotos</h1>
        <button
          type="button"
          className="botao botao--primario botao--pequeno"
          onClick={() => setEnviando(true)}
          disabled={MODO_DEMO}
        >
          Enviar foto
        </button>
      </div>
      <p className="texto-suave painel__explicacao">
        Fotos dos seus trabalhos. A ordem daqui é a da galeria do site; a página inicial mostra as mais recentes.
      </p>

      {MODO_DEMO && (
        <Aviso tipo="info">Na demonstração, dá para editar legendas e a ordem, mas não enviar nem remover fotos.</Aviso>
      )}
      {retorno && <Aviso tipo={retorno.tipo}>{retorno.texto}</Aviso>}

      <EstadoConsulta
        carregando={fotos.carregando && !fotos.dados}
        erro={fotos.erro}
        vazio={!lista.length}
        mensagemVazio="Nenhuma foto ainda. Envie a primeira!"
      >
        <ul className="grade-fotos" role="list">
          {lista.map((foto, i) => (
            <li key={foto.id} className="grade-fotos__item">
              <img src={foto.url} alt={foto.legenda || 'Foto sem legenda'} loading="lazy" decoding="async" />
              <p className={`grade-fotos__legenda ${foto.legenda ? '' : 'texto-suave'}`}>{foto.legenda || 'Sem legenda'}</p>
              <div className="grade-fotos__acoes">
                <button
                  type="button"
                  className="botao-acao"
                  onClick={() => setEditando({ foto, legenda: foto.legenda ?? '' })}
                  disabled={ocupado}
                >
                  Legenda<span className="sr-only"> da foto {i + 1}</span>
                </button>
                <button type="button" className="botao-acao botao-acao--icone" onClick={() => mover(i, -1)} disabled={ocupado || i === 0}>
                  <span aria-hidden="true">←</span>
                  <span className="sr-only">Mover foto {i + 1} para antes</span>
                </button>
                <button
                  type="button"
                  className="botao-acao botao-acao--icone"
                  onClick={() => mover(i, 1)}
                  disabled={ocupado || i === lista.length - 1}
                >
                  <span aria-hidden="true">→</span>
                  <span className="sr-only">Mover foto {i + 1} para depois</span>
                </button>
                {!MODO_DEMO && (
                  <button type="button" className="botao-acao botao-acao--cancelar" onClick={() => setRemovendo(foto)} disabled={ocupado}>
                    Remover<span className="sr-only"> foto {i + 1}</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </EstadoConsulta>

      <Modal aberto={enviando} titulo="Enviar foto" aoFechar={() => setEnviando(false)}>
        <EnviarFoto
          enviar={(foto, legenda) => enviarFoto(foto, legenda, menorOrdem)}
          aoCancelar={() => setEnviando(false)}
          aoEnviar={() => {
            setEnviando(false)
            avisar('Foto enviada. Ela já aparece na galeria do site.')
            fotos.recarregar()
          }}
        />
      </Modal>

      <Modal aberto={Boolean(editando)} titulo="Legenda da foto" aoFechar={() => setEditando(null)}>
        {editando && (
          <form className="formulario formulario--painel" onSubmit={salvarEdicao} noValidate>
            <img className="previa-pequena" src={editando.foto.url} alt="" />
            <Campo
              rotulo="Legenda"
              opcional
              maxLength={150}
              value={editando.legenda}
              onChange={(e) => setEditando((ed) => ({ ...ed, legenda: e.target.value }))}
            />
            <div className="modal__acoes">
              <Botao type="submit">Salvar legenda</Botao>
              <Botao variante="secundario" onClick={() => setEditando(null)}>
                Voltar
              </Botao>
            </div>
          </form>
        )}
      </Modal>

      <JanelaConfirmacao
        aberto={Boolean(removendo)}
        titulo="Remover foto?"
        rotuloConfirmar="Remover foto"
        aoConfirmar={confirmarRemocao}
        aoFechar={() => setRemovendo(null)}
      >
        {removendo && <img className="previa-pequena" src={removendo.url} alt="" />}
        <p>A foto sai da galeria e o arquivo é apagado. Não dá para desfazer.</p>
      </JanelaConfirmacao>
    </section>
  )
}

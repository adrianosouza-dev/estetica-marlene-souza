import { useState } from 'react'
import { FormPergunta } from '../../components/painel/FormPergunta'
import { Aviso } from '../../components/ui/Aviso'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { JanelaConfirmacao } from '../../components/ui/JanelaConfirmacao'
import { Modal } from '../../components/ui/Modal'
import { useAcao } from '../../hooks/useAcao'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarPerguntasAdmin, removerPergunta, trocarOrdem } from '../../lib/consultasCadastros'

/** Perguntas frequentes: criar, editar, mostrar/esconder, ordenar e apagar */
export default function Perguntas() {
  useTituloPagina('Perguntas frequentes')
  const perguntas = useConsulta(buscarPerguntasAdmin)
  const { ocupado, retorno, executar, avisar } = useAcao()
  const [editando, setEditando] = useState(null) // null | 'nova' | pergunta
  const [removendo, setRemovendo] = useState(null)

  const lista = perguntas.dados ?? []
  const proximaOrdem = Math.max(0, ...lista.map((p) => p.ordem)) + 1

  async function mover(indice, direcao) {
    const ok = await executar(() => trocarOrdem('perguntas_frequentes', lista[indice], lista[indice + direcao]))
    if (ok) perguntas.recarregar()
  }

  async function confirmarRemocao() {
    const p = removendo
    setRemovendo(null)
    const ok = await executar(() => removerPergunta(p.id), 'Pergunta apagada.')
    if (ok) perguntas.recarregar()
  }

  return (
    <section className="container pagina painel">
      <div className="painel__topo">
        <h1>Perguntas frequentes</h1>
        <button type="button" className="botao botao--primario botao--pequeno" onClick={() => setEditando('nova')}>
          Nova pergunta
        </button>
      </div>
      <p className="texto-suave painel__explicacao">
        Aparecem na página "Dúvidas" do site, nesta ordem. As três primeiras também aparecem na página inicial.
      </p>

      {retorno && <Aviso tipo={retorno.tipo}>{retorno.texto}</Aviso>}

      <EstadoConsulta
        carregando={perguntas.carregando && !perguntas.dados}
        erro={perguntas.erro}
        vazio={!lista.length}
        mensagemVazio="Nenhuma pergunta ainda. Crie a primeira!"
      >
        <ul className="cadastro" role="list">
          {lista.map((p, i) => (
            <li key={p.id} className={`cadastro__item ${p.ativa ? '' : 'cadastro__item--inativo'}`}>
              <div className="cadastro__info">
                <p className="cadastro__titulo">{p.pergunta}</p>
                <p className="cadastro__detalhe cadastro__resumo">{p.resposta}</p>
                {!p.ativa && <span className="status status--cancelado">Escondida do site</span>}
              </div>
              <div className="cadastro__acoes">
                <button type="button" className="botao-acao" onClick={() => setEditando(p)} disabled={ocupado}>
                  Editar<span className="sr-only"> pergunta {i + 1}</span>
                </button>
                <span className="cadastro__ordem">
                  <button type="button" className="botao-acao botao-acao--icone" onClick={() => mover(i, -1)} disabled={ocupado || i === 0}>
                    <span aria-hidden="true">↑</span>
                    <span className="sr-only">Subir pergunta {i + 1}</span>
                  </button>
                  <button
                    type="button"
                    className="botao-acao botao-acao--icone"
                    onClick={() => mover(i, 1)}
                    disabled={ocupado || i === lista.length - 1}
                  >
                    <span aria-hidden="true">↓</span>
                    <span className="sr-only">Descer pergunta {i + 1}</span>
                  </button>
                </span>
                <button type="button" className="botao-acao botao-acao--cancelar" onClick={() => setRemovendo(p)} disabled={ocupado}>
                  Apagar<span className="sr-only"> pergunta {i + 1}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </EstadoConsulta>

      <Modal
        aberto={Boolean(editando)}
        titulo={editando === 'nova' ? 'Nova pergunta' : 'Editar pergunta'}
        aoFechar={() => setEditando(null)}
      >
        {editando && (
          <FormPergunta
            pergunta={editando === 'nova' ? null : editando}
            proximaOrdem={proximaOrdem}
            aoCancelar={() => setEditando(null)}
            aoSalvar={() => {
              setEditando(null)
              avisar('Pergunta salva.')
              perguntas.recarregar()
            }}
          />
        )}
      </Modal>

      <JanelaConfirmacao
        aberto={Boolean(removendo)}
        titulo="Apagar pergunta?"
        rotuloConfirmar="Apagar pergunta"
        aoConfirmar={confirmarRemocao}
        aoFechar={() => setRemovendo(null)}
      >
        <p>"{removendo?.pergunta}" sai do site e não dá para desfazer. Para tirar só por um tempo, use "Editar" e desmarque "Mostrar no site".</p>
      </JanelaConfirmacao>
    </section>
  )
}

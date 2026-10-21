import { useState } from 'react'
import { FormServico } from '../../components/painel/FormServico'
import { Aviso } from '../../components/ui/Aviso'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { JanelaConfirmacao } from '../../components/ui/JanelaConfirmacao'
import { Modal } from '../../components/ui/Modal'
import { useAcao } from '../../hooks/useAcao'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarServicosAdmin, removerServico, salvarServico, trocarOrdem } from '../../lib/consultasCadastros'
import { formatarDuracao, formatarPreco } from '../../lib/formatadores'

/** Cadastro de serviços: criar, editar, ativar/desativar, ordenar e remover */
export default function Servicos() {
  useTituloPagina('Serviços')
  const servicos = useConsulta(buscarServicosAdmin)
  const { ocupado, retorno, executar, avisar } = useAcao()
  const [editando, setEditando] = useState(null) // null | 'novo' | serviço
  const [removendo, setRemovendo] = useState(null)

  const lista = servicos.dados ?? []
  const proximaOrdem = Math.max(0, ...lista.map((s) => s.ordem)) + 1

  async function alternarAtivo(s) {
    const ok = await executar(
      () => salvarServico({ ...s, ativo: !s.ativo }),
      s.ativo ? `${s.nome} desativado: não aparece mais no site.` : `${s.nome} ativado: já aparece no site.`,
    )
    if (ok) servicos.recarregar()
  }

  async function mover(indice, direcao) {
    const ok = await executar(() => trocarOrdem('servicos', lista[indice], lista[indice + direcao]))
    if (ok) servicos.recarregar()
  }

  async function confirmarRemocao() {
    const s = removendo
    setRemovendo(null)
    const ok = await executar(() => removerServico(s.id), `${s.nome} removido.`)
    if (ok) servicos.recarregar()
  }

  return (
    <section className="container pagina painel">
      <div className="painel__topo">
        <h1>Serviços</h1>
        <button type="button" className="botao botao--primario botao--pequeno" onClick={() => setEditando('novo')}>
          Novo serviço
        </button>
      </div>

      {retorno && <Aviso tipo={retorno.tipo}>{retorno.texto}</Aviso>}

      <EstadoConsulta carregando={servicos.carregando && !servicos.dados} erro={servicos.erro} vazio={!lista.length} mensagemVazio="Nenhum serviço cadastrado.">
        <ul className="cadastro" role="list">
          {lista.map((s, i) => (
            <li key={s.id} className={`cadastro__item ${s.ativo ? '' : 'cadastro__item--inativo'}`}>
              <div className="cadastro__info">
                <p className="cadastro__titulo">{s.nome}</p>
                <p className="cadastro__detalhe">
                  {formatarDuracao(s.duracao_minutos)}, {formatarPreco(s.preco)}
                </p>
                <span className={`status ${s.ativo ? 'status--confirmado' : 'status--cancelado'}`}>
                  {s.ativo ? 'Ativo' : 'Desativado'}
                </span>
              </div>

              <div className="cadastro__acoes">
                <button type="button" className="botao-acao" onClick={() => setEditando(s)} disabled={ocupado}>
                  Editar<span className="sr-only"> {s.nome}</span>
                </button>
                <button type="button" className="botao-acao" onClick={() => alternarAtivo(s)} disabled={ocupado}>
                  {s.ativo ? 'Desativar' : 'Ativar'}
                  <span className="sr-only"> {s.nome}</span>
                </button>
                <span className="cadastro__ordem">
                  <button type="button" className="botao-acao botao-acao--icone" onClick={() => mover(i, -1)} disabled={ocupado || i === 0}>
                    <span aria-hidden="true">↑</span>
                    <span className="sr-only">Subir {s.nome}</span>
                  </button>
                  <button
                    type="button"
                    className="botao-acao botao-acao--icone"
                    onClick={() => mover(i, 1)}
                    disabled={ocupado || i === lista.length - 1}
                  >
                    <span aria-hidden="true">↓</span>
                    <span className="sr-only">Descer {s.nome}</span>
                  </button>
                </span>
                {!s.usado && (
                  <button type="button" className="botao-acao botao-acao--cancelar" onClick={() => setRemovendo(s)} disabled={ocupado}>
                    Remover<span className="sr-only"> {s.nome}</span>
                  </button>
                )}
              </div>
              {s.usado && (
                <p className="cadastro__nota">Já foi agendado: para tirar do site, use "Desativar".</p>
              )}
            </li>
          ))}
        </ul>
      </EstadoConsulta>

      <Modal
        aberto={Boolean(editando)}
        titulo={editando === 'novo' ? 'Novo serviço' : 'Editar serviço'}
        aoFechar={() => setEditando(null)}
      >
        <FormServico
          servico={editando === 'novo' ? null : editando}
          proximaOrdem={proximaOrdem}
          aoCancelar={() => setEditando(null)}
          aoSalvar={(nome) => {
            setEditando(null)
            avisar(`${nome} salvo.`)
            servicos.recarregar()
          }}
        />
      </Modal>

      <JanelaConfirmacao
        aberto={Boolean(removendo)}
        titulo="Remover serviço?"
        rotuloConfirmar="Remover serviço"
        aoConfirmar={confirmarRemocao}
        aoFechar={() => setRemovendo(null)}
      >
        <p>
          {removendo?.nome} será apagado. Ele nunca foi agendado, então nada no histórico é afetado.
        </p>
      </JanelaConfirmacao>
    </section>
  )
}

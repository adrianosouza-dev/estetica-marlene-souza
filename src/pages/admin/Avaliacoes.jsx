import { useState } from 'react'
import { Aviso } from '../../components/ui/Aviso'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { Estrelas } from '../../components/ui/Estrelas'
import { JanelaConfirmacao } from '../../components/ui/JanelaConfirmacao'
import { useAcao } from '../../hooks/useAcao'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { aprovarAvaliacao, buscarAvaliacoesAdmin, removerAvaliacao } from '../../lib/consultasCadastros'

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
const ABAS = [
  { valor: 'pendente', rotulo: 'Pendentes' },
  { valor: 'aprovada', rotulo: 'Aprovadas' },
]

/** Avaliações das clientes: aprovar (aparece no site) ou remover */
export default function Avaliacoes() {
  useTituloPagina('Avaliações')
  const avaliacoes = useConsulta(buscarAvaliacoesAdmin)
  const { ocupado, retorno, executar } = useAcao()
  const [aba, setAba] = useState('pendente')
  const [removendo, setRemovendo] = useState(null)

  const todas = avaliacoes.dados ?? []
  const contagem = (status) => todas.filter((a) => a.status === status).length
  const lista = todas.filter((a) => a.status === aba)

  async function aprovar(a) {
    const ok = await executar(() => aprovarAvaliacao(a.id), `Avaliação de ${a.nome} aprovada: já aparece na página inicial.`)
    if (ok) avaliacoes.recarregar()
  }

  async function confirmarRemocao() {
    const a = removendo
    setRemovendo(null)
    const ok = await executar(() => removerAvaliacao(a.id), `Avaliação de ${a.nome} removida.`)
    if (ok) avaliacoes.recarregar()
  }

  return (
    <section className="container pagina painel">
      <h1>Avaliações</h1>

      {/* Abas: botões que trocam a lista; aria-pressed diz qual está ativa */}
      <div className="abas" role="group" aria-label="Filtrar avaliações">
        {ABAS.map((a) => (
          <button
            key={a.valor}
            type="button"
            className="abas__botao"
            aria-pressed={aba === a.valor}
            onClick={() => setAba(a.valor)}
          >
            {a.rotulo} <span className="abas__contagem">{contagem(a.valor)}</span>
          </button>
        ))}
      </div>

      {retorno && <Aviso tipo={retorno.tipo}>{retorno.texto}</Aviso>}

      <EstadoConsulta
        carregando={avaliacoes.carregando && !avaliacoes.dados}
        erro={avaliacoes.erro}
        vazio={!lista.length}
        mensagemVazio={aba === 'pendente' ? 'Nenhuma avaliação esperando aprovação.' : 'Nenhuma avaliação aprovada ainda.'}
      >
        <ul className="cadastro" role="list">
          {lista.map((a) => (
            <li key={a.id} className="cadastro__item">
              <div className="cadastro__info">
                <p className="cadastro__titulo">{a.nome}</p>
                <Estrelas nota={a.nota} />
                {a.comentario ? (
                  <p className="avaliacao-admin__texto">“{a.comentario}”</p>
                ) : (
                  <p className="cadastro__detalhe">Sem comentário</p>
                )}
                <p className="cadastro__detalhe">{formatoData.format(new Date(a.criado_em))}</p>
              </div>
              <div className="cadastro__acoes">
                {a.status === 'pendente' && (
                  <button type="button" className="botao-acao botao-acao--confirmar" onClick={() => aprovar(a)} disabled={ocupado}>
                    Aprovar<span className="sr-only"> avaliação de {a.nome}</span>
                  </button>
                )}
                <button type="button" className="botao-acao botao-acao--cancelar" onClick={() => setRemovendo(a)} disabled={ocupado}>
                  Remover<span className="sr-only"> avaliação de {a.nome}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </EstadoConsulta>

      <JanelaConfirmacao
        aberto={Boolean(removendo)}
        titulo="Remover avaliação?"
        rotuloConfirmar="Remover avaliação"
        aoConfirmar={confirmarRemocao}
        aoFechar={() => setRemovendo(null)}
      >
        <p>
          A avaliação de {removendo?.nome} será apagada
          {removendo?.status === 'aprovada' ? ' e sai da página inicial' : ''}. Não dá para desfazer.
        </p>
      </JanelaConfirmacao>
    </section>
  )
}

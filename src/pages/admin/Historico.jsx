import { useCallback, useId, useState } from 'react'
import { ListaAgendamentos } from '../../components/painel/ListaAgendamentos'
import { Campo } from '../../components/ui/Campo'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { useAoVoltar } from '../../hooks/useAoVoltar'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { STATUS, juntarTimestamp, mesDe } from '../../lib/agendaAdmin'
import { buscarHistorico } from '../../lib/consultasAdmin'
import { agoraEmManaus, somarDias } from '../../lib/disponibilidade'

const POR_PAGINA = 20

/** Datas de cada atalho de período */
function periodo(tipo, hoje, personalizado) {
  if (tipo === 'mes') return mesDe(hoje)
  if (tipo === 'mesPassado') return mesDe(somarDias(mesDe(hoje).inicio, -1))
  if (tipo === 'personalizado') return personalizado
  return { inicio: somarDias(hoje, -30), fim: hoje } // últimos 30 dias
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

/** Agendamentos que já passaram, com filtro por período, cliente e status */
export default function Historico() {
  useTituloPagina('Histórico')
  const [agora, setAgora] = useState(agoraEmManaus)
  const idPeriodo = useId()
  const idStatus = useId()

  // "formulario" é o que está sendo digitado; "filtros" é o que foi aplicado
  const inicial = { tipo: '30dias', de: somarDias(agora.data, -30), ate: agora.data, busca: '', status: '' }
  const [formulario, setFormulario] = useState(inicial)
  const [filtros, setFiltros] = useState(inicial)
  const [limite, setLimite] = useState(POR_PAGINA)

  const { inicio, fim } = periodo(filtros.tipo, agora.data, { inicio: filtros.de, fim: filtros.ate })
  const historico = useConsulta(
    buscarHistorico,
    {
      de: inicio,
      ate: fim,
      busca: filtros.busca,
      status: filtros.status,
      limite,
      agoraTs: juntarTimestamp(agora.data, agora.minutos),
    },
    { manterAnteriores: true }, // "Carregar mais" e filtros não fazem a lista sumir e voltar
  )

  useAoVoltar(useCallback(() => setAgora(agoraEmManaus()), []))

  const alterar = (campo) => (e) => setFormulario((f) => ({ ...f, [campo]: e.target.value }))

  function aplicar(evento) {
    evento.preventDefault()
    setFiltros(formulario)
    setLimite(POR_PAGINA)
  }

  function limpar() {
    setFormulario(inicial)
    setFiltros(inicial)
    setLimite(POR_PAGINA)
  }

  const dados = historico.dados
  const temMais = dados && dados.itens.length < dados.total

  return (
    <section className="container pagina painel">
      <h1>Histórico</h1>

      <form className="filtros" onSubmit={aplicar}>
        <div className="campo">
          <label htmlFor={idPeriodo} className="campo__rotulo">
            Período
          </label>
          <select id={idPeriodo} className="campo__entrada" value={formulario.tipo} onChange={alterar('tipo')}>
            <option value="30dias">Últimos 30 dias</option>
            <option value="mes">Este mês</option>
            <option value="mesPassado">Mês passado</option>
            <option value="personalizado">Escolher datas</option>
          </select>
        </div>

        {formulario.tipo === 'personalizado' && (
          <div className="formulario__linha">
            <Campo rotulo="De" type="date" value={formulario.de} max={agora.data} onChange={alterar('de')} />
            <Campo rotulo="Até" type="date" value={formulario.ate} max={agora.data} onChange={alterar('ate')} />
          </div>
        )}

        <Campo
          rotulo="Cliente"
          dica="Nome ou parte do telefone"
          type="search"
          value={formulario.busca}
          onChange={alterar('busca')}
          autoComplete="off"
        />

        <div className="campo">
          <label htmlFor={idStatus} className="campo__rotulo">
            Status
          </label>
          <select id={idStatus} className="campo__entrada" value={formulario.status} onChange={alterar('status')}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([valor, { curto }]) => (
              <option key={valor} value={valor}>
                {curto}
              </option>
            ))}
          </select>
        </div>

        <div className="filtros__acoes">
          <button type="submit" className="botao botao--primario botao--pequeno">
            Filtrar
          </button>
          <button type="button" className="botao-texto" onClick={limpar}>
            Limpar filtros
          </button>
        </div>
      </form>

      <EstadoConsulta carregando={historico.carregando && !dados} erro={historico.erro}>
        {dados && (
          <>
            <p className="historico__resumo" role="status">
              {plural(dados.total, 'agendamento', 'agendamentos')} no período:{' '}
              {plural(dados.concluidos, 'concluído', 'concluídos')} e {plural(dados.cancelados, 'cancelado', 'cancelados')}.
            </p>

            {dados.itens.length ? (
              <ListaAgendamentos agendamentos={dados.itens} agora={agora} mostrarData aoAlterar={historico.recarregar} />
            ) : (
              <p className="texto-suave painel__vazio">Nenhum agendamento encontrado com esses filtros.</p>
            )}

            {temMais && (
              <button
                type="button"
                className="botao botao--secundario painel__mais"
                disabled={historico.carregando}
                onClick={() => setLimite((l) => l + POR_PAGINA)}
              >
                {historico.carregando ? 'Carregando…' : 'Carregar mais'}
              </button>
            )}
          </>
        )}
      </EstadoConsulta>
    </section>
  )
}

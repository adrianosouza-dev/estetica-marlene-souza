import { useCallback, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ListaAgendamentos } from '../../components/painel/ListaAgendamentos'
import { Aviso } from '../../components/ui/Aviso'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { useAoVoltar } from '../../hooks/useAoVoltar'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { jaTerminou, juntarTimestamp, saudacao, semanaDe } from '../../lib/agendaAdmin'
import { buscarResumoPainel } from '../../lib/consultasAdmin'
import { agoraEmManaus } from '../../lib/disponibilidade'
import { formatarDataLonga, maiusculaInicial } from '../../lib/formatadores'

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

/** Início do painel: o dia de hoje, os próximos atendimentos e o que pede ação */
export default function Dashboard() {
  useTituloPagina('Painel')
  const aviso = useLocation().state?.aviso // ex.: "Senha alterada." vindo de /admin/nova-senha

  const [agora, setAgora] = useState(agoraEmManaus)
  const resumo = useConsulta(buscarResumoPainel, {
    hoje: agora.data,
    agoraTs: juntarTimestamp(agora.data, agora.minutos),
    semana: semanaDe(agora.data),
  })

  // Ao voltar para o painel, atualiza "agora" (e com isso busca os dados de novo)
  useAoVoltar(useCallback(() => setAgora(agoraEmManaus()), []))

  const dados = resumo.dados
  const proximoDeHoje = dados?.deHoje.find((a) => a.status !== 'concluido' && !jaTerminou(a, agora))

  return (
    <section className="container pagina painel">
      {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}

      <div className="painel__topo">
        <div>
          <h1>{saudacao(agora.minutos)}, Marlene</h1>
          <p className="texto-suave painel__data">{maiusculaInicial(formatarDataLonga(agora.data))}</p>
        </div>
        <button type="button" className="botao botao--secundario botao--pequeno" onClick={resumo.recarregar}>
          Atualizar
        </button>
      </div>

      {/* Ao recarregar, os dados atuais ficam na tela (e as mensagens das ações não somem) */}
      <EstadoConsulta carregando={resumo.carregando && !resumo.dados} erro={resumo.erro}>
        {dados && (
          <>
            <dl className="numeros">
              <div className="numeros__item">
                <dt>Hoje</dt>
                <dd>{dados.deHoje.length}</dd>
              </div>
              <div className="numeros__item">
                <dt>Esta semana</dt>
                <dd>{dados.totalSemana}</dd>
              </div>
              <div className={`numeros__item ${dados.pendentes ? 'numeros__item--atencao' : ''}`}>
                <dt>Aguardando confirmação</dt>
                <dd>{dados.pendentes}</dd>
              </div>
            </dl>

            {dados.avaliacoesPendentes > 0 && (
              <p className="painel__lembrete">
                <Link to="/admin/avaliacoes">
                  {plural(dados.avaliacoesPendentes, 'avaliação esperando', 'avaliações esperando')} sua aprovação
                </Link>
              </p>
            )}

            <section className="painel__bloco" aria-labelledby="titulo-hoje">
              <h2 id="titulo-hoje">Hoje</h2>
              {dados.deHoje.length ? (
                <ListaAgendamentos
                  agendamentos={dados.deHoje}
                  agora={agora}
                  destacarId={proximoDeHoje?.id}
                  aoAlterar={resumo.recarregar}
                />
              ) : (
                <p className="texto-suave">Nenhum atendimento hoje.</p>
              )}
            </section>

            <section className="painel__bloco" aria-labelledby="titulo-proximos">
              <div className="painel__titulo-linha">
                <h2 id="titulo-proximos">Próximos dias</h2>
                <Link to="/admin/agenda" className="link-simples">
                  Ver agenda
                </Link>
              </div>
              {dados.proximos.length ? (
                <ListaAgendamentos agendamentos={dados.proximos} agora={agora} mostrarData aoAlterar={resumo.recarregar} />
              ) : (
                <p className="texto-suave">Nenhum agendamento nos próximos dias.</p>
              )}
            </section>
          </>
        )}
      </EstadoConsulta>
    </section>
  )
}

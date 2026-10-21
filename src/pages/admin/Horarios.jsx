import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FormBloqueio } from '../../components/painel/FormBloqueio'
import { FormHorarioDia } from '../../components/painel/FormHorarioDia'
import { FormRegras } from '../../components/painel/FormRegras'
import { Aviso } from '../../components/ui/Aviso'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { JanelaConfirmacao } from '../../components/ui/JanelaConfirmacao'
import { Modal } from '../../components/ui/Modal'
import { useAcao } from '../../hooks/useAcao'
import { useConsulta } from '../../hooks/useConsulta'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { juntarTimestamp, separarTimestamp } from '../../lib/agendaAdmin'
import { buscarBloqueiosFuturos, buscarHorariosAdmin, buscarPerfilAdmin, removerBloqueio } from '../../lib/consultasCadastros'
import { agoraEmManaus, somarDias } from '../../lib/disponibilidade'
import { descreverHorarioDia, formatarDataCurta, formatarMinutos, maiusculaInicial, nomeDoDia, ordenarSemana } from '../../lib/formatadores'

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`
const diaMes = (data) => formatarDataCurta(data).diaMes

/** "27/10 (dia inteiro)", "27/10 a 31/10" ou "30/10, das 14h às 16h" */
function descreverPeriodo(bloqueio) {
  const inicio = separarTimestamp(bloqueio.inicio)
  const fim = separarTimestamp(bloqueio.fim)
  if (inicio.minutos === 0 && fim.minutos === 0) {
    const ultimo = somarDias(fim.data, -1)
    return ultimo === inicio.data ? `${diaMes(inicio.data)} (dia inteiro)` : `${diaMes(inicio.data)} a ${diaMes(ultimo)}`
  }
  if (inicio.data === fim.data) {
    return `${diaMes(inicio.data)}, das ${formatarMinutos(inicio.minutos)} às ${formatarMinutos(fim.minutos)}`
  }
  return `${diaMes(inicio.data)} ${formatarMinutos(inicio.minutos)} a ${diaMes(fim.data)} ${formatarMinutos(fim.minutos)}`
}

/** Funcionamento por dia da semana, folgas e regras do agendamento online */
export default function Horarios() {
  useTituloPagina('Horários')
  const [agora] = useState(agoraEmManaus)
  const horarios = useConsulta(buscarHorariosAdmin)
  const bloqueios = useConsulta(buscarBloqueiosFuturos, juntarTimestamp(agora.data, agora.minutos))
  const perfil = useConsulta(buscarPerfilAdmin)
  const { ocupado, retorno, executar, avisar } = useAcao()

  const [editandoDia, setEditandoDia] = useState(null)
  const [novaFolga, setNovaFolga] = useState(false)
  const [removendo, setRemovendo] = useState(null)
  const [avisoFolga, setAvisoFolga] = useState(null) // { agendamentos, primeiroDia }

  async function confirmarRemocao() {
    const b = removendo
    setRemovendo(null)
    setAvisoFolga(null)
    const ok = await executar(() => removerBloqueio(b.id), 'Folga removida. Os horários voltam a ficar livres no site.')
    if (ok) bloqueios.recarregar()
  }

  return (
    <section className="container pagina painel">
      <h1>Horários</h1>

      {retorno && <Aviso tipo={retorno.tipo}>{retorno.texto}</Aviso>}
      {avisoFolga?.agendamentos > 0 && (
        <Aviso tipo="info">
          Há {plural(avisoFolga.agendamentos, 'agendamento', 'agendamentos')} nesse período. Eles não foram cancelados.{' '}
          <Link to={`/admin/agenda?dia=${avisoFolga.primeiroDia}`}>Ver na agenda</Link> para avisar as clientes.
        </Aviso>
      )}

      {/* ---------- Funcionamento ---------- */}
      <section className="painel__bloco" aria-labelledby="titulo-funcionamento">
        <h2 id="titulo-funcionamento">Funcionamento</h2>
        <EstadoConsulta carregando={horarios.carregando && !horarios.dados} erro={horarios.erro}>
          <ul className="cadastro" role="list">
            {ordenarSemana(horarios.dados ?? []).map((h) => (
              <li key={h.dia_semana} className={`cadastro__item cadastro__item--linha ${h.aberto ? '' : 'cadastro__item--inativo'}`}>
                <div className="cadastro__info">
                  <p className="cadastro__titulo">{maiusculaInicial(nomeDoDia(h.dia_semana))}</p>
                  <p className="cadastro__detalhe">{descreverHorarioDia(h)}</p>
                </div>
                <button type="button" className="botao-acao" onClick={() => setEditandoDia(h)}>
                  Editar<span className="sr-only"> {nomeDoDia(h.dia_semana)}</span>
                </button>
              </li>
            ))}
          </ul>
        </EstadoConsulta>
      </section>

      {/* ---------- Folgas ---------- */}
      <section className="painel__bloco" aria-labelledby="titulo-folgas">
        <div className="painel__titulo-linha">
          <h2 id="titulo-folgas">Folgas e feriados</h2>
          <button type="button" className="botao botao--primario botao--pequeno" onClick={() => setNovaFolga(true)}>
            Nova folga
          </button>
        </div>
        <EstadoConsulta
          carregando={bloqueios.carregando && !bloqueios.dados}
          erro={bloqueios.erro}
          vazio={!bloqueios.dados?.length}
          mensagemVazio="Nenhuma folga marcada."
        >
          <ul className="cadastro" role="list">
            {bloqueios.dados?.map((b) => (
              <li key={b.id} className="cadastro__item cadastro__item--linha">
                <div className="cadastro__info">
                  <p className="cadastro__titulo">{b.motivo || 'Sem atendimento'}</p>
                  <p className="cadastro__detalhe">{descreverPeriodo(b)}</p>
                </div>
                <button type="button" className="botao-acao botao-acao--cancelar" onClick={() => setRemovendo(b)} disabled={ocupado}>
                  Remover<span className="sr-only"> folga {descreverPeriodo(b)}</span>
                </button>
              </li>
            ))}
          </ul>
        </EstadoConsulta>
      </section>

      {/* ---------- Regras ---------- */}
      <section className="painel__bloco" aria-labelledby="titulo-regras">
        <h2 id="titulo-regras">Agendamento pelo site</h2>
        <p className="texto-suave painel__explicacao">
          Com quanto tempo de antecedência as clientes podem agendar e até quantos dias à frente.
        </p>
        <EstadoConsulta carregando={perfil.carregando && !perfil.dados} erro={perfil.erro}>
          {perfil.dados && (
            <FormRegras perfil={perfil.dados} executar={executar} ocupado={ocupado} aoSalvar={perfil.recarregar} />
          )}
        </EstadoConsulta>
      </section>

      <Modal
        aberto={Boolean(editandoDia)}
        titulo={editandoDia ? maiusculaInicial(nomeDoDia(editandoDia.dia_semana)) : ''}
        aoFechar={() => setEditandoDia(null)}
      >
        {editandoDia && (
          <FormHorarioDia
            dia={editandoDia}
            aoCancelar={() => setEditandoDia(null)}
            aoSalvar={(mensagem) => {
              setEditandoDia(null)
              avisar(mensagem)
              horarios.recarregar()
            }}
          />
        )}
      </Modal>

      <Modal aberto={novaFolga} titulo="Nova folga" aoFechar={() => setNovaFolga(false)}>
        <FormBloqueio
          hoje={agora.data}
          aoCancelar={() => setNovaFolga(false)}
          aoSalvar={(resultado) => {
            setNovaFolga(false)
            avisar('Folga salva. Esses horários não aparecem mais no site.')
            setAvisoFolga(resultado)
            bloqueios.recarregar()
          }}
        />
      </Modal>

      <JanelaConfirmacao
        aberto={Boolean(removendo)}
        titulo="Remover folga?"
        rotuloConfirmar="Remover folga"
        aoConfirmar={confirmarRemocao}
        aoFechar={() => setRemovendo(null)}
      >
        <p>
          {removendo?.motivo || 'Sem atendimento'}: {removendo && descreverPeriodo(removendo)}. Os horários voltam a
          ficar livres para agendamento.
        </p>
      </JanelaConfirmacao>
    </section>
  )
}

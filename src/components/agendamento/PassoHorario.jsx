import { useState } from 'react'
import { useConsulta } from '../../hooks/useConsulta'
import { buscarHorariosOcupados } from '../../lib/consultas'
import { agoraEmManaus, diaDaSemana, gerarHorariosLivres } from '../../lib/disponibilidade'
import { formatarMinutos } from '../../lib/formatadores'
import { Aviso } from '../ui/Aviso'
import { EstadoConsulta } from '../ui/EstadoConsulta'

const MEIO_DIA = 12 * 60

/**
 * Passo 3: horários livres do dia escolhido.
 * Busca os horários ocupados na hora em que o passo abre, para a lista estar
 * sempre atualizada.
 */
export function PassoHorario({
  data,
  servico,
  horarios,
  bloqueios,
  antecedenciaMinutos,
  selecionado,
  aviso,
  proximoDia,
  aoEscolher,
  aoTrocarDia,
}) {
  const [agora] = useState(agoraEmManaus)
  const ocupados = useConsulta(buscarHorariosOcupados, data)

  const livres = ocupados.dados
    ? gerarHorariosLivres({
        data,
        horario: horarios.find((h) => h.dia_semana === diaDaSemana(data)),
        duracao: servico.duracao_minutos,
        ocupados: ocupados.dados,
        bloqueios,
        agora,
        antecedenciaMinutos,
      })
    : []

  const turnos = [
    { nome: 'Manhã', lista: livres.filter((m) => m < MEIO_DIA) },
    { nome: 'Tarde', lista: livres.filter((m) => m >= MEIO_DIA) },
  ].filter((t) => t.lista.length)

  return (
    <>
      {aviso && <Aviso tipo="erro">{aviso}</Aviso>}

      <EstadoConsulta carregando={ocupados.carregando} erro={ocupados.erro} vazio={!livres.length}>
        {turnos.map((turno) => (
          <div key={turno.nome} className="turno">
            <h3 className="turno__nome">{turno.nome}</h3>
            <ul className="grade-horarios" role="list">
              {turno.lista.map((minutos) => (
                <li key={minutos}>
                  <button
                    type="button"
                    className="horario"
                    aria-pressed={minutos === selecionado}
                    onClick={() => aoEscolher(minutos)}
                  >
                    {formatarMinutos(minutos)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </EstadoConsulta>

      {!ocupados.carregando && !ocupados.erro && !livres.length && (
        <div className="sem-horarios">
          <p>Nenhum horário livre neste dia para {servico.nome.toLowerCase()}.</p>
          {proximoDia && (
            <button type="button" className="link-simples botao-texto" onClick={() => aoTrocarDia(proximoDia)}>
              Ver o próximo dia com atendimento
            </button>
          )}
        </div>
      )}
    </>
  )
}

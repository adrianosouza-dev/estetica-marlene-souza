import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Confirmacao } from '../../components/agendamento/Confirmacao'
import { PassoDados } from '../../components/agendamento/PassoDados'
import { PassoDia } from '../../components/agendamento/PassoDia'
import { PassoHorario } from '../../components/agendamento/PassoHorario'
import { PassoServico } from '../../components/agendamento/PassoServico'
import { ResumoEscolhas } from '../../components/agendamento/ResumoEscolhas'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { useConsulta } from '../../hooks/useConsulta'
import { useNegocio } from '../../hooks/useNegocio'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarBloqueiosAPartirDe, buscarServicosAtivos, criarAgendamento } from '../../lib/consultas'
import { agoraEmManaus, listarDias, montarTimestamp } from '../../lib/disponibilidade'

const TITULOS = {
  1: 'Qual serviço?',
  2: 'Que dia fica melhor?',
  3: 'Qual horário?',
  4: 'Seus dados',
}
const TOTAL_PASSOS = 4

const MENSAGEM_CONFLITO =
  'Esse horário acabou de ser reservado por outra cliente. Escolha outro, por favor.'

/**
 * Fluxo de agendamento em 4 passos: serviço → dia → horário → dados.
 * Esta página guarda as escolhas e decide qual passo mostrar; cada passo
 * fica em src/components/agendamento.
 */
export default function Agendar() {
  useTituloPagina('Agendar horário')
  const negocio = useNegocio()
  const [parametros] = useSearchParams()

  // Quem chega por /agendar?servico=... (página de serviços) já começa no passo 2
  const [escolha, setEscolha] = useState(() => ({ servicoId: parametros.get('servico'), data: null, minutos: null }))
  const [passo, setPasso] = useState(() => (parametros.get('servico') ? 2 : 1))
  const [aviso, setAviso] = useState(null)
  const [envio, setEnvio] = useState({ enviando: false, erro: null })
  const [reservado, setReservado] = useState(null)

  const [agora] = useState(agoraEmManaus)
  const servicos = useConsulta(buscarServicosAtivos)
  const bloqueios = useConsulta(buscarBloqueiosAPartirDe, agora.data)

  const servico = servicos.dados?.find((s) => s.id === escolha.servicoId)
  // Serviço do link não existe mais (ou foi desativado): volta para a escolha
  const passoAtual = passo > 1 && !servicos.carregando && !servico ? 1 : passo

  const dias = listarDias({
    agora,
    diasMaximos: negocio.diasMaximos,
    horarios: negocio.horarios,
    bloqueios: bloqueios.dados ?? [],
    antecedenciaMinutos: negocio.antecedenciaMinutos,
  })

  // A cada troca de passo, o foco vai para o título (ajuda quem usa leitor de tela)
  const titulo = useRef(null)
  const primeiraVez = useRef(true)
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false
      return
    }
    titulo.current?.focus()
  }, [passoAtual])

  function irPara(numero) {
    setAviso(null)
    setEnvio({ enviando: false, erro: null })
    setPasso(numero)
  }

  const escolher = {
    servico: (servicoId) => {
      setEscolha({ servicoId, data: escolha.data, minutos: null })
      irPara(escolha.data ? 3 : 2)
    },
    dia: (data) => {
      setEscolha((e) => ({ ...e, data, minutos: null }))
      irPara(3)
    },
    horario: (minutos) => {
      setEscolha((e) => ({ ...e, minutos }))
      irPara(4)
    },
  }

  async function reservar({ nome, whatsapp }) {
    setEnvio({ enviando: true, erro: null })
    try {
      await criarAgendamento({
        servicoId: servico.id,
        inicio: montarTimestamp(escolha.data, escolha.minutos),
        nome,
        whatsapp,
      })
      setReservado({ servico, data: escolha.data, minutos: escolha.minutos, nome })
    } catch (erro) {
      if (erro.code === '23P01') {
        // Outra cliente reservou primeiro: volta para os horários, que são recarregados
        setEscolha((e) => ({ ...e, minutos: null }))
        setPasso(3)
        setAviso(MENSAGEM_CONFLITO)
        setEnvio({ enviando: false, erro: null })
      } else if (erro.code === 'P0001') {
        setEnvio({ enviando: false, erro: erro.message }) // regra da agenda, já em português
      } else {
        console.error(erro)
        setEnvio({ enviando: false, erro: 'Não foi possível reservar agora. Confira sua internet e tente de novo.' })
      }
    }
  }

  if (reservado) {
    return (
      <Confirmacao
        {...reservado}
        aoAgendarOutro={() => {
          setReservado(null)
          setEscolha({ servicoId: null, data: null, minutos: null })
          irPara(1)
        }}
      />
    )
  }

  const carregandoBase = servicos.carregando || negocio.carregando || bloqueios.carregando
  const proximoDia = dias.find((d) => d.disponivel && d.data > (escolha.data ?? ''))?.data

  return (
    <section className="container pagina secao--estreita agendar">
      <h1>Agendar horário</h1>

      <div className="progresso" aria-hidden="true">
        {Array.from({ length: TOTAL_PASSOS }, (_, i) => (
          <span key={i} className={`progresso__parte ${i < passoAtual ? 'progresso__parte--feita' : ''}`} />
        ))}
      </div>

      <ResumoEscolhas
        servico={passoAtual > 1 ? servico : null}
        data={passoAtual > 2 ? escolha.data : null}
        minutos={passoAtual > 3 ? escolha.minutos : null}
        aoTrocar={irPara}
      />

      <h2 ref={titulo} tabIndex={-1} className="agendar__titulo">
        <span className="agendar__contador">
          Passo {passoAtual} de {TOTAL_PASSOS}
        </span>
        {TITULOS[passoAtual]}
      </h2>

      <EstadoConsulta
        carregando={carregandoBase}
        erro={servicos.erro || negocio.erro || bloqueios.erro}
        vazio={!servicos.dados?.length}
        mensagemVazio="Nenhum serviço disponível para agendamento no momento."
      >
        {passoAtual === 1 && (
          <PassoServico servicos={servicos.dados ?? []} selecionadoId={escolha.servicoId} aoEscolher={escolher.servico} />
        )}

        {passoAtual === 2 && <PassoDia dias={dias} selecionado={escolha.data} aoEscolher={escolher.dia} />}

        {passoAtual === 3 && (
          <PassoHorario
            data={escolha.data}
            servico={servico}
            horarios={negocio.horarios}
            bloqueios={bloqueios.dados ?? []}
            antecedenciaMinutos={negocio.antecedenciaMinutos}
            selecionado={escolha.minutos}
            aviso={aviso}
            proximoDia={proximoDia}
            aoEscolher={escolher.horario}
            aoTrocarDia={escolher.dia}
          />
        )}

        {passoAtual === 4 && <PassoDados enviando={envio.enviando} erroEnvio={envio.erro} aoEnviar={reservar} />}
      </EstadoConsulta>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import { useNegocio } from '../../hooks/useNegocio'
import { enderecoSemQuebra, formatarDataLonga, formatarDuracao, formatarMinutos } from '../../lib/formatadores'
import { linkWhatsApp } from '../../lib/whatsapp'
import { Botao } from '../ui/Botao'

/** Tela final: o horário já está reservado (status pendente no banco) */
export function Confirmacao({ servico, data, minutos, nome, aoAgendarOutro }) {
  const { whatsapp, endereco, linkMapa, avisoCancelamento } = useNegocio()
  const titulo = useRef(null)

  // Leva o foco (e o leitor de tela) direto para a confirmação
  useEffect(() => {
    titulo.current?.focus()
  }, [])

  const quando = `${formatarDataLonga(data)}, às ${formatarMinutos(minutos)}`
  const mensagem = `Olá, Marlene! Agendei pelo site: ${servico.nome}, ${quando}. Meu nome é ${nome.trim()}.`
  const linkZap = linkWhatsApp(whatsapp, mensagem) // null se o número ainda não foi cadastrado

  return (
    <section className="container pagina secao--estreita confirmacao">
      <h1 ref={titulo} tabIndex={-1}>
        Horário reservado!
      </h1>
      <p className="confirmacao__aviso">A Marlene vai confirmar pelo WhatsApp.</p>

      <dl className="resumo resumo--final">
        <div className="resumo__linha">
          <dt>Serviço</dt>
          <dd>
            {servico.nome}, {formatarDuracao(servico.duracao_minutos)}
          </dd>
        </div>
        <div className="resumo__linha">
          <dt>Quando</dt>
          <dd>{quando}</dd>
        </div>
        <div className="resumo__linha">
          <dt>Onde</dt>
          <dd>
            {enderecoSemQuebra(endereco)}{' '}
            <a href={linkMapa} target="_blank" rel="noopener noreferrer">
              ver no mapa
            </a>
          </dd>
        </div>
      </dl>

      {/* Texto editável no Perfil do painel; vazio = não aparece */}
      {avisoCancelamento && <p className="confirmacao__politica">{avisoCancelamento}</p>}

      <div className="confirmacao__acoes">
        {linkZap && <Botao href={linkZap}>Avisar a Marlene no WhatsApp</Botao>}
        <button type="button" className="link-simples botao-texto" onClick={aoAgendarOutro}>
          Agendar outro horário
        </button>
      </div>
    </section>
  )
}

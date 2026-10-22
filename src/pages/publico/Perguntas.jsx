import { ListaFaq } from '../../components/secoes/ListaFaq'
import { Botao } from '../../components/ui/Botao'
import { EstadoConsulta } from '../../components/ui/EstadoConsulta'
import { useConsulta } from '../../hooks/useConsulta'
import { useNegocio } from '../../hooks/useNegocio'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { buscarPerguntas } from '../../lib/consultas'
import { linkWhatsApp } from '../../lib/whatsapp'

/** Perguntas frequentes, cadastradas pela Marlene no painel */
export default function Perguntas() {
  useTituloPagina('Dúvidas frequentes')
  const { whatsapp } = useNegocio()
  const perguntas = useConsulta(buscarPerguntas)
  const linkZap = linkWhatsApp(whatsapp, 'Olá, Marlene! Tenho uma dúvida.')

  return (
    <section className="container pagina secao--estreita">
      <h1>Dúvidas frequentes</h1>

      <EstadoConsulta
        carregando={perguntas.carregando}
        erro={perguntas.erro}
        vazio={!perguntas.dados?.length}
        mensagemVazio="As perguntas frequentes aparecem aqui em breve."
      >
        <ListaFaq perguntas={perguntas.dados ?? []} />
      </EstadoConsulta>

      {linkZap && (
        <div className="perguntas__ajuda">
          <p>Não achou sua dúvida? Pergunte direto para a Marlene.</p>
          <Botao href={linkZap} variante="secundario">
            Perguntar no WhatsApp
          </Botao>
        </div>
      )}
    </section>
  )
}

import { ListaFaq } from '../../components/secoes/ListaFaq'
import { Botao } from '../../components/ui/Botao'
import { perguntasFrequentes } from '../../config/faq'
import { useNegocio } from '../../hooks/useNegocio'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { linkWhatsApp } from '../../lib/whatsapp'

export default function Perguntas() {
  useTituloPagina('Dúvidas frequentes')
  const { whatsapp } = useNegocio()
  const linkZap = linkWhatsApp(whatsapp, 'Olá, Marlene! Tenho uma dúvida.')

  return (
    <section className="container pagina secao--estreita">
      <h1>Dúvidas frequentes</h1>
      <ListaFaq perguntas={perguntasFrequentes} />

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

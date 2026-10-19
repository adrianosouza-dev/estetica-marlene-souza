import { Botao } from '../../components/ui/Botao'
import { useTituloPagina } from '../../hooks/useTituloPagina'

export default function NaoEncontrada() {
  useTituloPagina('Página não encontrada')

  return (
    <section className="container pagina">
      <h1>Página não encontrada</h1>
      <p className="texto-suave">O endereço pode ter mudado ou estar digitado errado.</p>
      <Botao para="/" variante="secundario">
        Voltar para o início
      </Botao>
    </section>
  )
}

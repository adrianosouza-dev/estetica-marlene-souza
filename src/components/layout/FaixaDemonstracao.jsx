import { MODO_DEMO } from '../../config/demo'

/** Faixa no topo do site de demonstração: deixa claro que os dados são fictícios */
export function FaixaDemonstracao() {
  if (!MODO_DEMO) return null
  return (
    <p className="faixa-demo">
      Site de demonstração do portfólio: os dados são fictícios e voltam ao original toda madrugada.
    </p>
  )
}

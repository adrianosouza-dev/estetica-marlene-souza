import { Aviso } from './Aviso'

/**
 * Cuida dos três estados de uma busca antes de mostrar o conteúdo:
 * carregando, erro e lista vazia. Assim nenhuma página fica em branco.
 */
export function EstadoConsulta({ carregando, erro, vazio, mensagemVazio, children }) {
  if (carregando) {
    return (
      <p className="carregando" role="status">
        Carregando…
      </p>
    )
  }

  if (erro) {
    return (
      <Aviso tipo="erro">
        Não foi possível carregar esta parte agora. Confira sua internet e recarregue a página.
      </Aviso>
    )
  }

  if (vazio) return mensagemVazio ? <p className="texto-suave">{mensagemVazio}</p> : null

  return children
}

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Aviso } from '../ui/Aviso'

/**
 * Envolve todas as rotas do painel /admin.
 * Sem login (ou sem permissão), manda para /admin/login, lembrando a página
 * pedida para voltar a ela depois de entrar.
 *
 * É uma proteção da interface. A dos dados está no banco (Row Level Security).
 */
export function RotaProtegida() {
  const { carregando, usuario, ehProfissional, erroAcesso } = useAuth()
  const local = useLocation()

  if (carregando) {
    return (
      <p className="carregando container" role="status">
        Verificando acesso…
      </p>
    )
  }

  // Logada, mas a verificação falhou por falta de conexão: não desloga à toa
  if (usuario && !ehProfissional && erroAcesso) {
    return (
      <div className="container pagina">
        <Aviso tipo="erro">{erroAcesso}</Aviso>
      </div>
    )
  }

  if (!usuario || !ehProfissional) {
    return <Navigate to="/admin/login" replace state={{ de: local.pathname + local.search }} />
  }

  return <Outlet />
}

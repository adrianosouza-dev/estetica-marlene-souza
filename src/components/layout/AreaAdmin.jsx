import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { ProvedorAuth } from './ProvedorAuth'

/**
 * Raiz de tudo que fica em /admin (login, nova senha e painel).
 * Liga o acompanhamento do login só aqui: o site das clientes não precisa dele.
 */
export function AreaAdmin() {
  return (
    <ProvedorAuth>
      <Suspense
        fallback={
          <p className="carregando container" role="status">
            Carregando…
          </p>
        }
      >
        <Outlet />
      </Suspense>
    </ProvedorAuth>
  )
}

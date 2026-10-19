import { Outlet } from 'react-router-dom'

/**
 * Envolve todas as rotas do painel /admin.
 *
 * Fase 1: ainda deixa passar todo mundo, para podermos montar as telas.
 * Fase 5: vai verificar a sessão do Supabase Auth e mandar quem não estiver
 * logado para /admin/login.
 */
export function RotaProtegida() {
  return <Outlet />
}

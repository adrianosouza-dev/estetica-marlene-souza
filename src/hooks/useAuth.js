import { createContext, useContext } from 'react'

/*
 * Estado do login da profissional, fornecido pelo ProvedorAuth:
 * {
 *   carregando:     true enquanto confere a sessão e a permissão
 *   usuario:        conta logada (ou null)
 *   ehProfissional: a conta é a ligada ao perfil?
 *   erroAcesso:     mensagem para mostrar no login (ex.: conta sem acesso)
 *   recuperacao:    entrou pelo link de "Esqueci minha senha"
 * }
 */
export const AuthContexto = createContext(null)

export function useAuth() {
  const contexto = useContext(AuthContexto)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <ProvedorAuth>.')
  return contexto
}

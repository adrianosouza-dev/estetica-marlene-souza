import { createContext, useContext } from 'react'

/*
 * Dados do negócio (perfil + horários), buscados uma vez pelo ProvedorNegocio
 * e lidos por qualquer página pública com useNegocio().
 */
export const NegocioContexto = createContext(null)

export function useNegocio() {
  const contexto = useContext(NegocioContexto)
  if (!contexto) throw new Error('useNegocio precisa estar dentro de <ProvedorNegocio>.')
  return contexto
}

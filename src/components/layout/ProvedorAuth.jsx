import { useEffect, useState } from 'react'
import { AuthContexto } from '../../hooks/useAuth'
import { sair, verificarProfissional } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

const SEM_ACESSO = 'Esta conta não tem acesso ao painel.'
const FALHA_VERIFICACAO = 'Não foi possível verificar o acesso. Confira sua internet e recarregue a página.'

/**
 * Acompanha a sessão do Supabase Auth e confere, no banco, se a conta logada
 * é a profissional. Envolve só as rotas /admin: o site das clientes não usa login.
 */
export function ProvedorAuth({ children }) {
  const [estado, setEstado] = useState({
    carregando: Boolean(supabase), // sem Supabase configurado, não há o que esperar
    usuario: null,
    ehProfissional: false,
    erroAcesso: supabase ? null : 'O site ainda não está conectado ao banco de dados.',
    recuperacao: false,
  })

  useEffect(() => {
    if (!supabase) return

    // Dispara ao abrir (INITIAL_SESSION), ao entrar, ao sair e ao renovar a sessão
    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      const usuario = sessao?.user ?? null
      const recuperacao = evento === 'PASSWORD_RECOVERY'

      if (!usuario) {
        // Mantém a mensagem de "sem acesso" para a tela de login mostrar
        setEstado((e) => ({ ...e, carregando: false, usuario: null, ehProfissional: false, recuperacao: false }))
        return
      }

      // Só a renovação automática do token: a permissão já foi conferida
      if (evento === 'TOKEN_REFRESHED' || evento === 'USER_UPDATED') {
        setEstado((e) => ({ ...e, usuario }))
        return
      }

      setEstado((e) => ({ ...e, carregando: true, erroAcesso: null }))

      // Chamadas ao Supabase dentro deste aviso podem travar a sessão
      // (orientação da documentação); por isso a verificação roda logo depois.
      setTimeout(async () => {
        try {
          const ehProfissional = await verificarProfissional()
          if (!ehProfissional) {
            setEstado((e) => ({ ...e, erroAcesso: SEM_ACESSO }))
            await sair()
            return
          }
          setEstado((e) => ({
            ...e,
            carregando: false,
            usuario,
            ehProfissional: true,
            recuperacao: e.recuperacao || recuperacao,
          }))
        } catch (erro) {
          console.error(erro)
          setEstado((e) => ({ ...e, carregando: false, usuario, ehProfissional: false, erroAcesso: FALHA_VERIFICACAO }))
        }
      }, 0)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthContexto.Provider value={estado}>{children}</AuthContexto.Provider>
}

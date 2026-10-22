import { useEffect, useRef, useState } from 'react'
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

  // Conta já conferida como profissional nesta sessão (evita verificar de novo)
  const verificado = useRef(null)

  useEffect(() => {
    if (!supabase) return

    // Dispara ao abrir (INITIAL_SESSION), ao entrar, ao sair e ao renovar a sessão
    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      const usuario = sessao?.user ?? null
      const recuperacao = evento === 'PASSWORD_RECOVERY'

      if (!usuario) {
        verificado.current = null
        // Mantém a mensagem de "sem acesso" para a tela de login mostrar
        setEstado((e) => ({ ...e, carregando: false, usuario: null, ehProfissional: false, recuperacao: false }))
        return
      }

      // Renovação do token, dados da conta alterados ou novo login da MESMA conta já
      // verificada (ex.: "Trocar minha senha" confere a senha atual entrando de novo):
      // não precisa verificar de novo, e a tela não pisca "Verificando acesso…"
      if (evento === 'TOKEN_REFRESHED' || evento === 'USER_UPDATED' || verificado.current === usuario.id) {
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
          verificado.current = usuario.id
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

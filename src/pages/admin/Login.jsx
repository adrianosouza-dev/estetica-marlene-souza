import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Aviso } from '../../components/ui/Aviso'
import { Botao } from '../../components/ui/Botao'
import { Campo } from '../../components/ui/Campo'
import { CampoSenha } from '../../components/ui/CampoSenha'
import { FaixaDemonstracao } from '../../components/layout/FaixaDemonstracao'
import { Guarana } from '../../components/ui/Guarana'
import { ACESSO_DEMO, MODO_DEMO } from '../../config/demo'
import { useAuth } from '../../hooks/useAuth'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { entrar, pedirNovaSenha } from '../../lib/auth'

/**
 * /admin/login: entrar no painel e pedir o link de "Esqueci minha senha".
 */
export default function Login() {
  useTituloPagina('Entrar no painel')
  const { carregando, usuario, ehProfissional, erroAcesso } = useAuth()
  const local = useLocation()
  const destino = local.state?.de ?? '/admin'

  const [modo, setModo] = useState('entrar') // entrar | esqueci | link-enviado
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [tentouEntrar, setTentouEntrar] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)

  // Depois de enviar, o botão fica em "Entrando…" também enquanto a permissão é conferida
  const entrando = enviando || (tentouEntrar && carregando)

  // Já logada: vai direto para o painel (ou para a página que tentou abrir)
  if (!carregando && usuario && ehProfissional) return <Navigate to={destino} replace />

  function trocarModo(novo) {
    setModo(novo)
    setErros({})
    setErroEnvio(null)
  }

  async function aoEntrar(evento) {
    evento.preventDefault()
    const encontrados = {}
    if (!email.includes('@')) encontrados.email = 'Digite o e-mail da conta.'
    if (!senha) encontrados.senha = 'Digite a senha.'
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    setEnviando(true)
    setTentouEntrar(true)
    setErroEnvio(null)
    try {
      await entrar(email, senha)
      // O ProvedorAuth confere a permissão; quando confirmar, o <Navigate> acima leva ao painel
    } catch (erro) {
      setErroEnvio(erro.message)
    } finally {
      setEnviando(false)
    }
  }

  async function aoPedirLink(evento) {
    evento.preventDefault()
    if (!email.includes('@')) {
      setErros({ email: 'Digite o e-mail da conta.' })
      return
    }
    setEnviando(true)
    setErroEnvio(null)
    try {
      await pedirNovaSenha(email)
      setModo('link-enviado')
    } catch (erro) {
      setErroEnvio(erro.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <FaixaDemonstracao />
      <main className="acesso">
        <div className="acesso__caixa">
          <Guarana className="acesso__marca" />

          {modo === 'entrar' && (
            <>
              <h1>Painel da Marlene</h1>
              <p className="texto-suave">Entre com o e-mail e a senha da sua conta.</p>

              {erroAcesso && <Aviso tipo="erro">{erroAcesso}</Aviso>}

              {/* Site de demonstração: credenciais públicas, para quem visita o portfólio */}
              {MODO_DEMO && ACESSO_DEMO.email && (
                <div className="acesso__demo">
                  <p>
                    <strong>Acesso de demonstração</strong>
                  </p>
                  <p>
                    E-mail: <code>{ACESSO_DEMO.email}</code>
                    <br />
                    Senha: <code>{ACESSO_DEMO.senha}</code>
                  </p>
                  <button
                    type="button"
                    className="botao-texto"
                    onClick={() => {
                      setEmail(ACESSO_DEMO.email)
                      setSenha(ACESSO_DEMO.senha)
                      setErros({})
                    }}
                  >
                    Preencher para mim
                  </button>
                </div>
              )}

              <form className="formulario" onSubmit={aoEntrar} noValidate>
                <Campo
                  rotulo="E-mail"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  erro={erros.email}
                  required
                />
                <CampoSenha
                  rotulo="Senha"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  erro={erros.senha}
                  required
                />
                {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}
                <Botao type="submit" disabled={entrando} bloco>
                  {entrando ? 'Entrando…' : 'Entrar'}
                </Botao>
              </form>

              {/* Na demonstração não há recuperação de senha (a senha é pública) */}
              {!MODO_DEMO && (
                <button type="button" className="botao-texto acesso__link" onClick={() => trocarModo('esqueci')}>
                  Esqueci minha senha
                </button>
              )}
            </>
          )}

          {modo === 'esqueci' && (
            <>
              <h1>Esqueci minha senha</h1>
              <p className="texto-suave">Digite o e-mail da conta. Vamos enviar um link para você criar uma senha nova.</p>

              <form className="formulario" onSubmit={aoPedirLink} noValidate>
                <Campo
                  rotulo="E-mail"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  erro={erros.email}
                  required
                />
                {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}
                <Botao type="submit" disabled={enviando} bloco>
                  {enviando ? 'Enviando…' : 'Enviar link'}
                </Botao>
              </form>

              <button type="button" className="botao-texto acesso__link" onClick={() => trocarModo('entrar')}>
                Voltar para o login
              </button>
            </>
          )}

          {modo === 'link-enviado' && (
            <>
              <h1>Confira seu e-mail</h1>
              {/* Mesma mensagem exista ou não a conta: não revela quais e-mails estão cadastrados */}
              <Aviso tipo="sucesso">
                Se esse e-mail tiver uma conta, o link para criar uma senha nova chega em alguns minutos. Olhe também a
                caixa de spam.
              </Aviso>
              <button type="button" className="botao-texto acesso__link" onClick={() => trocarModo('entrar')}>
                Voltar para o login
              </button>
            </>
          )}

          <Link to="/" className="acesso__site">
            Ir para o site
          </Link>
        </div>
      </main>
    </>
  )
}

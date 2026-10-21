import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Aviso } from '../../components/ui/Aviso'
import { Botao } from '../../components/ui/Botao'
import { CampoSenha } from '../../components/ui/CampoSenha'
import { Guarana } from '../../components/ui/Guarana'
import { useAuth } from '../../hooks/useAuth'
import { useTituloPagina } from '../../hooks/useTituloPagina'
import { definirNovaSenha } from '../../lib/auth'

const TAMANHO_MINIMO = 8

/**
 * /admin/nova-senha: aberta pelo link do e-mail de "Esqueci minha senha".
 * O link já entra na conta (sessão de recuperação); aqui só falta escolher a senha.
 */
export default function NovaSenha() {
  useTituloPagina('Criar nova senha')
  const { carregando, usuario, ehProfissional } = useAuth()
  const navegar = useNavigate()

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)

  async function aoSalvar(evento) {
    evento.preventDefault()
    const encontrados = {}
    if (senha.length < TAMANHO_MINIMO) encontrados.senha = `Use pelo menos ${TAMANHO_MINIMO} caracteres.`
    if (confirmacao !== senha) encontrados.confirmacao = 'As duas senhas precisam ser iguais.'
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    setEnviando(true)
    setErroEnvio(null)
    try {
      await definirNovaSenha(senha)
      navegar('/admin', { replace: true, state: { aviso: 'Senha alterada.' } })
    } catch (erro) {
      setErroEnvio(erro.message)
      setEnviando(false)
    }
  }

  let conteudo
  if (carregando) {
    conteudo = (
      <p className="carregando" role="status">
        Verificando o link…
      </p>
    )
  } else if (!usuario || !ehProfissional) {
    conteudo = (
      <>
        <h1>Link expirado</h1>
        <Aviso tipo="erro">Este link já foi usado ou expirou. Peça um novo na tela de login.</Aviso>
        <Link to="/admin/login" className="link-simples acesso__link">
          Ir para o login
        </Link>
      </>
    )
  } else {
    conteudo = (
      <>
        <h1>Criar nova senha</h1>
        <p className="texto-suave">Escolha uma senha com pelo menos {TAMANHO_MINIMO} caracteres.</p>
        <form className="formulario" onSubmit={aoSalvar} noValidate>
          <CampoSenha
            rotulo="Nova senha"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            erro={erros.senha}
            required
          />
          <CampoSenha
            rotulo="Repita a nova senha"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            erro={erros.confirmacao}
            required
          />
          {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}
          <Botao type="submit" disabled={enviando} bloco>
            {enviando ? 'Salvando…' : 'Salvar nova senha'}
          </Botao>
        </form>
      </>
    )
  }

  return (
    <main className="acesso">
      <div className="acesso__caixa">
        <Guarana className="acesso__marca" />
        {conteudo}
      </div>
    </main>
  )
}

import { erroAmigavel } from './erros'
import { supabase } from './supabase'

/*
 * Login da profissional (Supabase Auth).
 *
 * Importante: esta parte só cuida da tela. A proteção de verdade está no banco
 * (Row Level Security): mesmo logada, uma conta que não seja a da profissional
 * não lê nem altera nada.
 */

function cliente() {
  if (!supabase) throw new Error('O site ainda não está conectado ao banco de dados.')
  return supabase
}

/** Endereço para onde o e-mail de "Esqueci minha senha" leva */
export const CAMINHO_NOVA_SENHA = '/admin/nova-senha'

/** Traduz os erros do Supabase Auth para mensagens claras em português */
export function traduzirErroAuth(erro) {
  const codigo = erro?.code
  const mensagem = (erro?.message ?? '').toLowerCase()

  if (codigo === 'invalid_credentials' || mensagem.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (codigo === 'email_not_confirmed') return 'Este e-mail ainda não foi confirmado.'
  if (erro?.status === 429 || codigo?.startsWith('over_')) {
    return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  }
  if (codigo === 'weak_password') return 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.'
  if (codigo === 'same_password') return 'A nova senha precisa ser diferente da atual.'
  if (erro?.name === 'AuthRetryableFetchError' || mensagem.includes('failed to fetch')) {
    return 'Sem conexão com o servidor. Confira sua internet e tente de novo.'
  }
  return 'Não foi possível concluir agora. Tente de novo em instantes.'
}

/** Lança o erro já traduzido (e marcado como amigável), para a tela só mostrar erro.message */
function falhar(erro) {
  console.error(erro)
  throw erroAmigavel(traduzirErroAuth(erro))
}

export async function entrar(email, senha) {
  const { error } = await cliente().auth.signInWithPassword({ email: email.trim(), password: senha })
  if (error) falhar(error)
}

export async function sair() {
  const { error } = await cliente().auth.signOut()
  if (error) falhar(error)
}

/** Envia o e-mail com o link para criar uma nova senha */
export async function pedirNovaSenha(email) {
  const { error } = await cliente().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}${CAMINHO_NOVA_SENHA}`,
  })
  if (error) falhar(error)
}

/**
 * Troca a senha da conta logada (usada depois de abrir o link do e-mail).
 * senha_definida: marca na conta que a senha provisória já foi trocada
 * (o lembrete do painel some).
 */
export async function definirNovaSenha(senha) {
  const { error } = await cliente().auth.updateUser({ password: senha, data: { senha_definida: true } })
  if (error) falhar(error)
}

/**
 * "Trocar minha senha" no Perfil. Antes de trocar, confere a senha atual
 * entrando de novo com ela: quem pegar o celular já logado não troca a senha.
 */
export async function trocarSenha(email, senhaAtual, novaSenha) {
  const { error: erroAtual } = await cliente().auth.signInWithPassword({ email, password: senhaAtual })
  if (erroAtual) {
    if (erroAtual.code === 'invalid_credentials' || /invalid login credentials/i.test(erroAtual.message ?? '')) {
      throw erroAmigavel('A senha atual não confere.')
    }
    falhar(erroAtual)
  }
  await definirNovaSenha(novaSenha)
}

/** Pergunta ao banco se a conta logada é a profissional ligada ao perfil */
export async function verificarProfissional() {
  const { data, error } = await cliente().rpc('eh_profissional')
  if (error) throw error
  return data === true
}

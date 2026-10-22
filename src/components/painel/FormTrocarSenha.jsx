import { useState } from 'react'
import { trocarSenha } from '../../lib/auth'
import { CampoSenha } from '../ui/CampoSenha'

const TAMANHO_MINIMO = 8

/** "Trocar minha senha": confere a senha atual antes de gravar a nova */
export function FormTrocarSenha({ email, executar, ocupado }) {
  const vazio = { atual: '', nova: '', repetir: '' }
  const [dados, setDados] = useState(vazio)
  const [erros, setErros] = useState({})

  const alterar = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }))
    setErros((e) => ({ ...e, [campo]: undefined }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    const encontrados = {}
    if (!dados.atual) encontrados.atual = 'Digite a senha que você usa hoje.'
    if (dados.nova.length < TAMANHO_MINIMO) encontrados.nova = `Use pelo menos ${TAMANHO_MINIMO} caracteres.`
    else if (dados.nova === dados.atual) encontrados.nova = 'A nova senha precisa ser diferente da atual.'
    if (dados.repetir !== dados.nova) encontrados.repetir = 'As duas senhas novas precisam ser iguais.'
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    const ok = await executar(() => trocarSenha(email, dados.atual, dados.nova), 'Senha trocada. Use a nova senha no próximo login.')
    if (ok) setDados(vazio) // não deixa senha guardada na tela
  }

  return (
    <form className="formulario formulario--painel formulario--senha" onSubmit={salvar} noValidate>
      {/* Campo escondido com o e-mail: ajuda o gerenciador de senhas do celular a salvar a senha nova */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <CampoSenha
        rotulo="Senha atual"
        autoComplete="current-password"
        value={dados.atual}
        onChange={(e) => alterar('atual', e.target.value)}
        erro={erros.atual}
      />
      <CampoSenha
        rotulo="Nova senha"
        dica={`Pelo menos ${TAMANHO_MINIMO} caracteres.`}
        autoComplete="new-password"
        value={dados.nova}
        onChange={(e) => alterar('nova', e.target.value)}
        erro={erros.nova}
      />
      <CampoSenha
        rotulo="Repita a nova senha"
        autoComplete="new-password"
        value={dados.repetir}
        onChange={(e) => alterar('repetir', e.target.value)}
        erro={erros.repetir}
      />
      <div>
        <button type="submit" className="botao botao--primario" disabled={ocupado}>
          {ocupado ? 'Trocando…' : 'Trocar senha'}
        </button>
      </div>
    </form>
  )
}

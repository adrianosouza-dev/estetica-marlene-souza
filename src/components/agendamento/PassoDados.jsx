import { useState } from 'react'
import { mascararTelefone } from '../../lib/formatadores'
import { Aviso } from '../ui/Aviso'
import { Botao } from '../ui/Botao'
import { Campo } from '../ui/Campo'

function validar({ nome, telefone }) {
  const erros = {}
  const digitos = telefone.replace(/\D/g, '')
  if (nome.trim().length < 2) erros.nome = 'Escreva seu nome.'
  if (digitos.length < 10) erros.telefone = 'Digite o WhatsApp com DDD. Ex.: (92) 99123-4567'
  return erros
}

/** Passo 4: nome e WhatsApp. Envia { nome, whatsapp } com o número só em dígitos. */
export function PassoDados({ enviando, erroEnvio, aoEnviar }) {
  const [dados, setDados] = useState({ nome: '', telefone: '' })
  const [erros, setErros] = useState({})

  // Ao editar um campo, o erro dele some (a validação completa roda de novo ao enviar)
  function alterar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }))
    setErros((e) => ({ ...e, [campo]: undefined }))
  }

  function enviar(evento) {
    evento.preventDefault()
    const encontrados = validar(dados)
    setErros(encontrados)
    if (Object.keys(encontrados).length) return
    aoEnviar({ nome: dados.nome, whatsapp: dados.telefone.replace(/\D/g, '') })
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <Campo
        rotulo="Seu nome"
        value={dados.nome}
        onChange={(e) => alterar('nome', e.target.value)}
        erro={erros.nome}
        autoComplete="name"
        maxLength={80}
        required
      />
      <Campo
        rotulo="Seu WhatsApp"
        dica="A Marlene confirma o horário por aqui."
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="(92) 99123-4567"
        value={dados.telefone}
        onChange={(e) => alterar('telefone', mascararTelefone(e.target.value))}
        erro={erros.telefone}
        required
      />

      {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}

      <Botao type="submit" disabled={enviando}>
        {enviando ? 'Reservando…' : 'Reservar horário'}
      </Botao>
    </form>
  )
}

import { useState } from 'react'
import { salvarPergunta } from '../../lib/consultasCadastros'
import { textoDoErro } from '../../lib/erros'
import { Aviso } from '../ui/Aviso'
import { Botao } from '../ui/Botao'
import { Campo } from '../ui/Campo'

/** Criar (pergunta = null) ou editar uma pergunta frequente */
export function FormPergunta({ pergunta, proximaOrdem, aoSalvar, aoCancelar }) {
  const [dados, setDados] = useState({
    pergunta: pergunta?.pergunta ?? '',
    resposta: pergunta?.resposta ?? '',
    ativa: pergunta?.ativa ?? true,
  })
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)

  function alterar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }))
    setErros((e) => ({ ...e, [campo]: undefined }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    const encontrados = {}
    if (dados.pergunta.trim().length < 3) encontrados.pergunta = 'Escreva a pergunta.'
    if (!dados.resposta.trim()) encontrados.resposta = 'Escreva a resposta.'
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    setEnviando(true)
    setErroEnvio(null)
    try {
      await salvarPergunta({ id: pergunta?.id, ...dados, ordem: proximaOrdem })
      aoSalvar()
    } catch (erro) {
      console.error(erro)
      setErroEnvio(textoDoErro(erro))
      setEnviando(false)
    }
  }

  return (
    <form className="formulario formulario--painel" onSubmit={salvar} noValidate>
      <Campo
        rotulo="Pergunta"
        value={dados.pergunta}
        onChange={(e) => alterar('pergunta', e.target.value)}
        erro={erros.pergunta}
        maxLength={200}
      />
      <Campo
        rotulo="Resposta"
        dica="Pode usar várias linhas."
        multilinha
        rows={5}
        maxLength={1500}
        value={dados.resposta}
        onChange={(e) => alterar('resposta', e.target.value)}
        erro={erros.resposta}
      />
      <label className="interruptor">
        <input type="checkbox" checked={dados.ativa} onChange={(e) => alterar('ativa', e.target.checked)} />
        <span>Mostrar no site</span>
      </label>

      {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}

      <div className="modal__acoes">
        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar pergunta'}
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Voltar
        </Botao>
      </div>
    </form>
  )
}

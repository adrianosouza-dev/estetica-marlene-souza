import { useId, useState } from 'react'
import { opcoesDuracao, precoParaTexto, textoParaPreco } from '../../lib/edicao'
import { textoDoErro } from '../../lib/erros'
import { salvarServico } from '../../lib/consultasCadastros'
import { Aviso } from '../ui/Aviso'
import { Botao } from '../ui/Botao'
import { Campo } from '../ui/Campo'

const DURACOES = opcoesDuracao()

/** Criar (servico = null) ou editar um serviço */
export function FormServico({ servico, proximaOrdem, aoSalvar, aoCancelar }) {
  const idDuracao = useId()
  const [dados, setDados] = useState({
    nome: servico?.nome ?? '',
    descricao: servico?.descricao ?? '',
    duracao: servico?.duracao_minutos ?? 60,
    preco: precoParaTexto(servico?.preco ?? 0),
    ativo: servico?.ativo ?? true,
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
    const preco = textoParaPreco(dados.preco)
    const encontrados = {}
    if (dados.nome.trim().length < 2) encontrados.nome = 'Escreva o nome do serviço.'
    if (Number.isNaN(preco)) encontrados.preco = 'Use só números, por exemplo 35,00. Deixe vazio para "Consultar".'
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    setEnviando(true)
    setErroEnvio(null)
    try {
      await salvarServico({
        id: servico?.id,
        nome: dados.nome,
        descricao: dados.descricao,
        duracao_minutos: Number(dados.duracao),
        preco,
        ativo: dados.ativo,
        ordem: proximaOrdem,
      })
      aoSalvar(dados.nome.trim())
    } catch (erro) {
      console.error(erro)
      setErroEnvio(textoDoErro(erro))
      setEnviando(false)
    }
  }

  const duracaoMudou = servico && Number(dados.duracao) !== servico.duracao_minutos

  return (
    <form className="formulario formulario--painel" onSubmit={salvar} noValidate>
      <Campo rotulo="Nome" value={dados.nome} onChange={(e) => alterar('nome', e.target.value)} erro={erros.nome} maxLength={80} />
      <Campo
        rotulo="Descrição"
        opcional
        multilinha
        rows={2}
        maxLength={500}
        value={dados.descricao}
        onChange={(e) => alterar('descricao', e.target.value)}
      />

      <div className="formulario__linha">
        <div className="campo">
          <label htmlFor={idDuracao} className="campo__rotulo">
            Duração máxima
          </label>
          <select
            id={idDuracao}
            className="campo__entrada"
            value={dados.duracao}
            onChange={(e) => alterar('duracao', e.target.value)}
          >
            {DURACOES.map((d) => (
              <option key={d.minutos} value={d.minutos}>
                {d.rotulo}
              </option>
            ))}
          </select>
        </div>
        <Campo
          rotulo="Preço (R$)"
          inputMode="decimal"
          placeholder="Consultar"
          value={dados.preco}
          onChange={(e) => alterar('preco', e.target.value)}
          erro={erros.preco}
        />
      </div>

      <p className="formulario__nota texto-suave">
        A duração é o tempo que fica reservado na agenda. Preço vazio aparece como "Consultar" no site.
      </p>
      {duracaoMudou && (
        <Aviso tipo="info">A nova duração vale para os próximos agendamentos. Os que já existem não mudam.</Aviso>
      )}

      <label className="interruptor">
        <input type="checkbox" checked={dados.ativo} onChange={(e) => alterar('ativo', e.target.checked)} />
        <span>Ativo (aparece no site e no agendamento)</span>
      </label>

      {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}

      <div className="modal__acoes">
        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar serviço'}
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Voltar
        </Botao>
      </div>
    </form>
  )
}

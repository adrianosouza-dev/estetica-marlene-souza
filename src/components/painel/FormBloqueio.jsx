import { useState } from 'react'
import { juntarTimestamp } from '../../lib/agendaAdmin'
import { contarAgendamentosNoPeriodo, criarBloqueio } from '../../lib/consultasCadastros'
import { horaParaMinutos, somarDias } from '../../lib/disponibilidade'
import { textoDoErro } from '../../lib/erros'
import { Aviso } from '../ui/Aviso'
import { Botao } from '../ui/Botao'
import { Campo } from '../ui/Campo'

/**
 * Nova folga: dia(s) inteiro(s) ou parte de um dia.
 * Não cancela agendamentos: avisa quantos existem no período (aoSalvar recebe a contagem).
 */
export function FormBloqueio({ hoje, aoSalvar, aoCancelar }) {
  const [dados, setDados] = useState({ tipo: 'dia', de: hoje, ate: hoje, data: hoje, horaInicio: '', horaFim: '', motivo: '' })
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)

  const alterar = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }))
    setErros({})
  }

  /** Período em timestamps do banco, ou erros de preenchimento */
  function montarPeriodo() {
    const encontrados = {}
    if (dados.tipo === 'dia') {
      if (!dados.de) encontrados.de = 'Escolha o primeiro dia.'
      if (!dados.ate) encontrados.ate = 'Escolha o último dia.'
      if (dados.de && dados.ate && dados.ate < dados.de) encontrados.ate = 'O último dia não pode ser antes do primeiro.'
      if (dados.ate && dados.ate < hoje) encontrados.ate = 'Escolha uma data de hoje em diante.'
      return { encontrados, inicio: `${dados.de}T00:00:00`, fim: `${somarDias(dados.ate, 1)}T00:00:00` }
    }
    if (!dados.data) encontrados.data = 'Escolha o dia.'
    if (!dados.horaInicio) encontrados.horaInicio = 'Informe o início.'
    if (!dados.horaFim) encontrados.horaFim = 'Informe o fim.'
    if (dados.horaInicio && dados.horaFim && horaParaMinutos(dados.horaFim) <= horaParaMinutos(dados.horaInicio)) {
      encontrados.horaFim = 'O fim precisa ser depois do início.'
    }
    if (dados.data && dados.data < hoje) encontrados.data = 'Escolha uma data de hoje em diante.'
    return {
      encontrados,
      inicio: dados.horaInicio && juntarTimestamp(dados.data, horaParaMinutos(dados.horaInicio)),
      fim: dados.horaFim && juntarTimestamp(dados.data, horaParaMinutos(dados.horaFim)),
    }
  }

  async function salvar(evento) {
    evento.preventDefault()
    const { encontrados, inicio, fim } = montarPeriodo()
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    setEnviando(true)
    setErroEnvio(null)
    try {
      await criarBloqueio({ inicio, fim, motivo: dados.motivo })
      const agendamentos = await contarAgendamentosNoPeriodo({ inicio, fim }).catch(() => 0)
      aoSalvar({ agendamentos, primeiroDia: inicio.slice(0, 10) })
    } catch (erro) {
      console.error(erro)
      setErroEnvio(textoDoErro(erro))
      setEnviando(false)
    }
  }

  return (
    <form className="formulario formulario--painel" onSubmit={salvar} noValidate>
      <fieldset className="opcoes-tipo">
        <legend className="campo__rotulo">Tipo de folga</legend>
        <label className="interruptor">
          <input type="radio" name="tipo" checked={dados.tipo === 'dia'} onChange={() => alterar('tipo', 'dia')} />
          <span>Dia inteiro (um ou vários dias)</span>
        </label>
        <label className="interruptor">
          <input type="radio" name="tipo" checked={dados.tipo === 'parte'} onChange={() => alterar('tipo', 'parte')} />
          <span>Só uma parte do dia</span>
        </label>
      </fieldset>

      {dados.tipo === 'dia' ? (
        <div className="formulario__linha">
          <Campo rotulo="De" type="date" min={hoje} value={dados.de} onChange={(e) => alterar('de', e.target.value)} erro={erros.de} />
          <Campo rotulo="Até" type="date" min={dados.de || hoje} value={dados.ate} onChange={(e) => alterar('ate', e.target.value)} erro={erros.ate} />
        </div>
      ) : (
        <>
          <Campo rotulo="Dia" type="date" min={hoje} value={dados.data} onChange={(e) => alterar('data', e.target.value)} erro={erros.data} />
          <div className="formulario__linha">
            <Campo rotulo="Das" type="time" step={900} value={dados.horaInicio} onChange={(e) => alterar('horaInicio', e.target.value)} erro={erros.horaInicio} />
            <Campo rotulo="Às" type="time" step={900} value={dados.horaFim} onChange={(e) => alterar('horaFim', e.target.value)} erro={erros.horaFim} />
          </div>
        </>
      )}

      <Campo
        rotulo="Motivo"
        opcional
        dica="Aparece para as clientes no agendamento (ex.: Feriado, Folga)."
        maxLength={120}
        value={dados.motivo}
        onChange={(e) => alterar('motivo', e.target.value)}
      />

      {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}

      <div className="modal__acoes">
        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar folga'}
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Voltar
        </Botao>
      </div>
    </form>
  )
}

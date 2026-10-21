import { useId, useState } from 'react'
import { useConsulta } from '../../hooks/useConsulta'
import { buscarServicosAtivosAdmin, criarAgendamentoPainel } from '../../lib/consultasAdmin'
import { horaParaMinutos } from '../../lib/disponibilidade'
import { formatarDuracao, mascararTelefone } from '../../lib/formatadores'
import { Aviso } from '../ui/Aviso'
import { Botao } from '../ui/Botao'
import { Campo } from '../ui/Campo'

function validar(d) {
  const erros = {}
  if (!d.servicoId) erros.servicoId = 'Escolha o serviço.'
  if (!d.data) erros.data = 'Escolha o dia.'
  if (!d.hora) erros.hora = 'Escolha o horário.'
  if (d.nome.trim().length < 2) erros.nome = 'Escreva o nome da cliente.'
  const digitos = d.telefone.replace(/\D/g, '')
  if (digitos && digitos.length < 10) erros.telefone = 'Digite com DDD, ou deixe em branco.'
  return erros
}

/**
 * Cadastro feito pela Marlene (cliente que marcou por WhatsApp ou pessoalmente).
 * Entra como confirmado. O banco impede conflito com outro horário (erro 23P01).
 */
export function FormNovoAgendamento({ dataInicial, aoCriar, aoCancelar }) {
  const servicos = useConsulta(buscarServicosAtivosAdmin)
  const idServico = useId()
  const [dados, setDados] = useState({ servicoId: '', data: dataInicial, hora: '', nome: '', telefone: '', observacao: '' })
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)

  function alterar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }))
    setErros((e) => ({ ...e, [campo]: undefined }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    const encontrados = validar(dados)
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    setEnviando(true)
    setErroEnvio(null)
    try {
      await criarAgendamentoPainel({
        servicoId: dados.servicoId,
        data: dados.data,
        minutos: horaParaMinutos(dados.hora),
        nome: dados.nome,
        whatsapp: dados.telefone.replace(/\D/g, ''),
        observacao: dados.observacao,
      })
      aoCriar({ data: dados.data, nome: dados.nome.trim() })
    } catch (erro) {
      console.error(erro)
      if (erro.code === '23P01') setErroEnvio('Já existe um agendamento nesse horário. Escolha outro horário.')
      else if (erro.code === '23514') setErroEnvio('Confira os dados: algum campo está num formato que o sistema não aceita.')
      else setErroEnvio('Não foi possível salvar agora. Confira sua internet e tente de novo.')
      setEnviando(false)
    }
  }

  return (
    <form className="formulario formulario--painel" onSubmit={salvar} noValidate>
      <div className={`campo ${erros.servicoId ? 'campo--erro' : ''}`}>
        <label htmlFor={idServico} className="campo__rotulo">
          Serviço
        </label>
        <select
          id={idServico}
          className="campo__entrada"
          value={dados.servicoId}
          onChange={(e) => alterar('servicoId', e.target.value)}
          aria-invalid={erros.servicoId ? true : undefined}
          disabled={servicos.carregando}
        >
          <option value="">{servicos.carregando ? 'Carregando…' : 'Escolha'}</option>
          {servicos.dados?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome} ({formatarDuracao(s.duracao_minutos)})
            </option>
          ))}
        </select>
        {erros.servicoId && <p className="campo__erro">{erros.servicoId}</p>}
      </div>

      <div className="formulario__linha">
        <Campo rotulo="Dia" type="date" value={dados.data} onChange={(e) => alterar('data', e.target.value)} erro={erros.data} />
        <Campo
          rotulo="Horário"
          type="time"
          step={900}
          value={dados.hora}
          onChange={(e) => alterar('hora', e.target.value)}
          erro={erros.hora}
        />
      </div>

      <Campo
        rotulo="Nome da cliente"
        value={dados.nome}
        onChange={(e) => alterar('nome', e.target.value)}
        erro={erros.nome}
        maxLength={80}
        autoComplete="off"
      />
      <Campo
        rotulo="WhatsApp"
        opcional
        type="tel"
        inputMode="numeric"
        placeholder="(92) 99123-4567"
        value={dados.telefone}
        onChange={(e) => alterar('telefone', mascararTelefone(e.target.value))}
        erro={erros.telefone}
        autoComplete="off"
      />
      <Campo
        rotulo="Observação"
        opcional
        multilinha
        rows={2}
        maxLength={300}
        value={dados.observacao}
        onChange={(e) => alterar('observacao', e.target.value)}
      />

      <p className="texto-suave formulario__nota">
        O horário reserva o tempo máximo do serviço. Você pode encaixar fora do expediente; o sistema só impede
        horários que batem com outro agendamento.
      </p>

      {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}

      <div className="modal__acoes">
        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar agendamento'}
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Voltar
        </Botao>
      </div>
    </form>
  )
}

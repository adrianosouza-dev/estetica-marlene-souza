import { useState } from 'react'
import { salvarHorarios } from '../../lib/consultasCadastros'
import { validarHorarioDia } from '../../lib/edicao'
import { textoDoErro } from '../../lib/erros'
import { nomeDoDia } from '../../lib/formatadores'
import { Aviso } from '../ui/Aviso'
import { Botao } from '../ui/Botao'
import { Campo } from '../ui/Campo'

const SEGUNDA_A_SABADO = [1, 2, 3, 4, 5, 6]
const hhmm = (hora) => (hora ? hora.slice(0, 5) : '')

/** Editar o funcionamento de um dia da semana (com atalho para segunda a sábado) */
export function FormHorarioDia({ dia, aoSalvar, aoCancelar }) {
  const [dados, setDados] = useState({
    aberto: dia.aberto,
    abre: hhmm(dia.abre) || '08:00',
    fecha: hhmm(dia.fecha) || '17:00',
    temAlmoco: Boolean(dia.almoco_inicio),
    almoco_inicio: hhmm(dia.almoco_inicio) || '12:00',
    almoco_fim: hhmm(dia.almoco_fim) || '13:00',
  })
  const [repetir, setRepetir] = useState(false)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)

  const alterar = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }))
    setErros({})
  }

  async function salvar(evento) {
    evento.preventDefault()
    const encontrados = validarHorarioDia(dados)
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    // Linha no formato da tabela; dia fechado e "sem almoço" gravam horas vazias
    const linha = (dia_semana) => ({
      dia_semana,
      aberto: dados.aberto,
      abre: dados.aberto ? dados.abre : null,
      fecha: dados.aberto ? dados.fecha : null,
      almoco_inicio: dados.aberto && dados.temAlmoco ? dados.almoco_inicio : null,
      almoco_fim: dados.aberto && dados.temAlmoco ? dados.almoco_fim : null,
    })
    const dias = repetir ? SEGUNDA_A_SABADO : [dia.dia_semana]

    setEnviando(true)
    setErroEnvio(null)
    try {
      await salvarHorarios(dias.map(linha))
      aoSalvar(repetir ? 'Horário de segunda a sábado salvo.' : `Horário de ${nomeDoDia(dia.dia_semana)} salvo.`)
    } catch (erro) {
      console.error(erro)
      setErroEnvio(textoDoErro(erro))
      setEnviando(false)
    }
  }

  return (
    <form className="formulario formulario--painel" onSubmit={salvar} noValidate>
      <label className="interruptor">
        <input type="checkbox" checked={dados.aberto} onChange={(e) => alterar('aberto', e.target.checked)} />
        <span>Atende neste dia</span>
      </label>

      {dados.aberto && (
        <>
          <div className="formulario__linha">
            <Campo rotulo="Abre às" type="time" step={900} value={dados.abre} onChange={(e) => alterar('abre', e.target.value)} erro={erros.abre} />
            <Campo rotulo="Fecha às" type="time" step={900} value={dados.fecha} onChange={(e) => alterar('fecha', e.target.value)} erro={erros.fecha} />
          </div>

          <label className="interruptor">
            <input type="checkbox" checked={dados.temAlmoco} onChange={(e) => alterar('temAlmoco', e.target.checked)} />
            <span>Tem intervalo de almoço</span>
          </label>

          {dados.temAlmoco && (
            <div className="formulario__linha">
              <Campo
                rotulo="Almoço de"
                type="time"
                step={900}
                value={dados.almoco_inicio}
                onChange={(e) => alterar('almoco_inicio', e.target.value)}
                erro={erros.almoco_inicio}
              />
              <Campo
                rotulo="Até"
                type="time"
                step={900}
                value={dados.almoco_fim}
                onChange={(e) => alterar('almoco_fim', e.target.value)}
                erro={erros.almoco_fim}
              />
            </div>
          )}
        </>
      )}

      {SEGUNDA_A_SABADO.includes(dia.dia_semana) && (
        <label className="interruptor">
          <input type="checkbox" checked={repetir} onChange={(e) => setRepetir(e.target.checked)} />
          <span>Usar este horário de segunda a sábado</span>
        </label>
      )}

      <p className="formulario__nota texto-suave">
        Mudar o horário não cancela agendamentos já marcados; confira a agenda se precisar avisar alguma cliente.
      </p>

      {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}

      <div className="modal__acoes">
        <Botao type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar horário'}
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar}>
          Voltar
        </Botao>
      </div>
    </form>
  )
}

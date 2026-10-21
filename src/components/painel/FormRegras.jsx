import { useState } from 'react'
import { salvarPerfil } from '../../lib/consultasCadastros'
import { LIMITES } from '../../lib/edicao'
import { Aviso } from '../ui/Aviso'
import { Campo } from '../ui/Campo'

const { antecedenciaHoras: H, diasMaximos: D } = LIMITES

/** Regras do agendamento online: antecedência mínima (horas) e até quantos dias à frente */
export function FormRegras({ perfil, executar, ocupado, aoSalvar }) {
  const [dados, setDados] = useState({
    horas: String(Math.round(perfil.antecedencia_minima_minutos / 60)),
    dias: String(perfil.dias_maximos_agendamento),
  })
  const [erros, setErros] = useState({})

  const alterar = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }))
    setErros({})
  }

  async function salvar(evento) {
    evento.preventDefault()
    const horas = Number(dados.horas)
    const dias = Number(dados.dias)
    const encontrados = {}
    if (!Number.isInteger(horas) || horas < H.min || horas > H.max) encontrados.horas = `Use um número de ${H.min} a ${H.max}.`
    if (!Number.isInteger(dias) || dias < D.min || dias > D.max) encontrados.dias = `Use um número de ${D.min} a ${D.max}.`
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    const ok = await executar(
      () => salvarPerfil({ antecedencia_minima_minutos: horas * 60, dias_maximos_agendamento: dias }),
      'Regras do agendamento salvas.',
    )
    if (ok) aoSalvar()
  }

  return (
    <form className="formulario formulario--painel formulario--regras" onSubmit={salvar} noValidate>
      {/* Um campo embaixo do outro: lado a lado, os rótulos longos desalinhavam as caixas no celular */}
      <Campo
        rotulo="Antecedência mínima (horas)"
        dica={`De ${H.min} a ${H.max}h antes do horário`}
        type="number"
        inputMode="numeric"
        min={H.min}
        max={H.max}
        value={dados.horas}
        onChange={(e) => alterar('horas', e.target.value)}
        erro={erros.horas}
      />
      <Campo
        rotulo="Agenda aberta (dias)"
        dica={`De ${D.min} a ${D.max} dias à frente`}
        type="number"
        inputMode="numeric"
        min={D.min}
        max={D.max}
        value={dados.dias}
        onChange={(e) => alterar('dias', e.target.value)}
        erro={erros.dias}
      />
      {Object.keys(erros).length > 0 && <Aviso tipo="erro">Confira os valores destacados.</Aviso>}
      <div>
        <button type="submit" className="botao botao--primario botao--pequeno" disabled={ocupado}>
          Salvar regras
        </button>
      </div>
    </form>
  )
}

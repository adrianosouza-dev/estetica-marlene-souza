/*
 * Funções que transformam dados do banco em texto para as clientes.
 */

const formatoReal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 0 → "Consultar"; 35 → "R$ 35,00" */
export function formatarPreco(preco) {
  const valor = Number(preco)
  return valor > 0 ? formatoReal.format(valor) : 'Consultar'
}

/** 120 → "até 2h"; 90 → "até 1h30"; 45 → "até 45 min" (sempre o tempo máximo) */
export function formatarDuracao(minutos) {
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas === 0) return `até ${resto} min`
  return `até ${horas}h${resto ? String(resto).padStart(2, '0') : ''}`
}

/** "08:00:00" → "8h"; "12:30:00" → "12h30" */
export function formatarHora(hora) {
  if (!hora) return ''
  const [h, m] = hora.split(':').map(Number)
  return `${h}h${m ? String(m).padStart(2, '0') : ''}`
}

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
// A semana do salão começa na segunda
const ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0]

export function nomeDoDia(diaSemana) {
  return DIAS[diaSemana]
}

const maiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1)

/** Linhas da tabela horarios_funcionamento na ordem segunda → domingo */
export function ordenarSemana(horarios) {
  return ORDEM_SEMANA.map((dia) => horarios.find((h) => h.dia_semana === dia)).filter(Boolean)
}

/**
 * Resume a semana numa frase, juntando dias seguidos com o mesmo horário.
 * Ex.: "Segunda a sábado, das 8h às 17h"
 */
export function resumirHorarios(horarios) {
  const grupos = []
  for (const h of ordenarSemana(horarios)) {
    if (!h.aberto) continue
    const faixa = `das ${formatarHora(h.abre)} às ${formatarHora(h.fecha)}`
    const ultimo = grupos.at(-1)
    const seguido = ultimo && ORDEM_SEMANA.indexOf(h.dia_semana) === ORDEM_SEMANA.indexOf(ultimo.fim) + 1
    if (ultimo && seguido && ultimo.faixa === faixa) ultimo.fim = h.dia_semana
    else grupos.push({ inicio: h.dia_semana, fim: h.dia_semana, faixa })
  }

  return grupos
    .map(({ inicio, fim, faixa }) => {
      const dias = inicio === fim ? nomeDoDia(inicio) : `${nomeDoDia(inicio)} a ${nomeDoDia(fim)}`
      return `${maiuscula(dias)}, ${faixa}`
    })
    .join('; ')
}

/** "5592991234567" → "(92) 99123-4567" */
export function formatarTelefone(numero) {
  const local = String(numero).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  const m = local.match(/^(\d{2})(\d{4,5})(\d{4})$/)
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : numero
}

/*
 * Conversões e validações dos formulários do painel (serviços, horários,
 * regras e perfil). Funções puras, testadas em edicao.test.js.
 */
import { horaParaMinutos } from './disponibilidade'

/** Limites das regras do agendamento online (iguais aos do banco, migration 008) */
export const LIMITES = {
  antecedenciaHoras: { min: 0, max: 48 },
  diasMaximos: { min: 7, max: 90 },
}

// ---------- Preço ----------

/** 35.5 → '35,50'; 0 → '' (campo vazio = "Consultar") */
export function precoParaTexto(preco) {
  const valor = Number(preco)
  return valor > 0 ? valor.toFixed(2).replace('.', ',') : ''
}

/** '35,50', '35.5' ou 'R$ 35' → 35.5; vazio → 0; texto inválido → NaN */
export function textoParaPreco(texto) {
  const limpo = String(texto ?? '').replace(/R\$\s*/i, '').trim()
  if (!limpo) return 0
  // "1.250,00" → "1250.00"; "35,5" → "35.5"
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return NaN
  return Number(normalizado)
}

// ---------- Duração ----------

/** Opções de duração de 15 em 15 minutos, de 15 min a 8h: [{ minutos, rotulo }] */
export function opcoesDuracao() {
  const opcoes = []
  for (let minutos = 15; minutos <= 480; minutos += 15) {
    const h = Math.floor(minutos / 60)
    const m = minutos % 60
    const rotulo = h === 0 ? `${m} min` : `${h}h${m ? String(m).padStart(2, '0') : ''}`
    opcoes.push({ minutos, rotulo })
  }
  return opcoes
}

// ---------- Horário de funcionamento ----------

/**
 * Confere o horário de um dia, com as mesmas regras do banco.
 * dia: { aberto, abre, fecha, temAlmoco, almoco_inicio, almoco_fim } (horas 'HH:MM')
 * Retorna { campo: mensagem } (vazio se estiver tudo certo).
 */
export function validarHorarioDia(dia) {
  const erros = {}
  if (!dia.aberto) return erros

  if (!dia.abre) erros.abre = 'Informe a hora de abrir.'
  if (!dia.fecha) erros.fecha = 'Informe a hora de fechar.'
  if (erros.abre || erros.fecha) return erros

  const abre = horaParaMinutos(dia.abre)
  const fecha = horaParaMinutos(dia.fecha)
  if (fecha <= abre) erros.fecha = 'Precisa fechar depois de abrir.'

  if (dia.temAlmoco) {
    if (!dia.almoco_inicio) erros.almoco_inicio = 'Informe o início do almoço.'
    if (!dia.almoco_fim) erros.almoco_fim = 'Informe o fim do almoço.'
    if (dia.almoco_inicio && dia.almoco_fim) {
      const ai = horaParaMinutos(dia.almoco_inicio)
      const af = horaParaMinutos(dia.almoco_fim)
      if (af <= ai) erros.almoco_fim = 'O almoço precisa terminar depois de começar.'
      else if (ai < abre || af > fecha) erros.almoco_inicio = 'O almoço precisa ficar dentro do expediente.'
    }
  }
  return erros
}

// ---------- Perfil ----------

/** '@marlene', 'instagram.com/marlene/' ou 'https://www.instagram.com/marlene?igsh=x' → 'marlene' */
export function limparInstagram(texto) {
  const t = String(texto ?? '').trim()
  if (!t) return ''
  const doLink = t.match(/instagram\.com\/([^/?#\s]+)/i)
  const usuario = doLink ? doLink[1] : t.replace(/^@/, '')
  return usuario.replace(/[^A-Za-z0-9._]/g, '')
}

/** Telefone digitado ('(92) 99123-4567') → como o perfil guarda ('5592991234567'); vazio → null */
export function whatsappParaPerfil(texto) {
  const d = String(texto ?? '').replace(/\D/g, '')
  if (!d) return null
  return d.startsWith('55') && d.length >= 12 ? d : `55${d}`
}

/** Como o perfil guarda ('5592991234567') → só DDD + número, para o campo com máscara */
export function whatsappDoPerfil(numero) {
  return String(numero ?? '').replace(/^55(?=\d{10,11}$)/, '')
}

/** Aceita só links http(s); vazio é permitido (o site monta a busca no mapa) */
export function linkValido(texto) {
  const t = String(texto ?? '').trim()
  if (!t) return true
  try {
    const url = new URL(t)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

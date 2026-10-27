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

/*
 * TikTok e Facebook: aceitam '@usuario', 'usuario' ou o link do perfil e guardam só o usuário.
 * Devolvem '' quando o campo está vazio e null quando é um link que não diz qual é o
 * perfil (ex.: link encurtado de compartilhamento): a tela pede o link da página do perfil.
 * Os formatos aceitos são os mesmos que o banco confere (migration 011).
 */
export const TIKTOK_VALIDO = /^[A-Za-z0-9_.]{2,24}$/
export const FACEBOOK_VALIDO = /^([A-Za-z0-9.]{3,50}|profile\.php\?id=[0-9]{5,20})$/

const pareceLink = (t) => /^https?:|\/|\.com\b/i.test(t)

/** '@marlene', 'tiktok.com/@marlene?lang=pt-BR' → 'marlene'; 'vm.tiktok.com/ZM123/' → null */
export function limparTiktok(texto) {
  const t = String(texto ?? '').trim()
  if (!t) return ''
  if (pareceLink(t)) {
    const doLink = t.match(/tiktok\.com\/@([^/?#\s]+)/i)
    return doLink ? doLink[1].replace(/[^A-Za-z0-9_.]/g, '') : null
  }
  return t.replace(/^@/, '').replace(/[^A-Za-z0-9_.]/g, '')
}

// Endereços do Facebook que não são o nome de um perfil
const FACEBOOK_NAO_PERFIL = new Set(['share', 'sharer', 'groups', 'watch', 'pages', 'events', 'story.php', 'permalink.php', 'photo.php'])

/**
 * '@marlene', 'facebook.com/marlene', 'm.facebook.com/marlene/' → 'marlene';
 * 'facebook.com/profile.php?id=1000123' ou 'facebook.com/people/Nome/1000123/' → 'profile.php?id=1000123';
 * 'facebook.com/share/abc/' ou 'fb.me/abc' → null
 */
export function limparFacebook(texto) {
  const t = String(texto ?? '').trim()
  if (!t) return ''
  if (!pareceLink(t)) return t.replace(/^@/, '').replace(/[^A-Za-z0-9.]/g, '')

  const id = t.match(/profile\.php\?(?:[^#\s]*&)?id=(\d+)/i) ?? t.match(/(?:facebook|fb)\.com\/people\/[^/]+\/(\d+)/i)
  if (id) return `profile.php?id=${id[1]}`

  const doLink = t.match(/(?:facebook|fb)\.com\/([^/?#\s]+)/i)
  if (!doLink || FACEBOOK_NAO_PERFIL.has(doLink[1].toLowerCase()) || doLink[1].toLowerCase() === 'profile.php') return null
  return doLink[1].replace(/[^A-Za-z0-9.]/g, '')
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

// ---------- Certificados ----------

/**
 * Confere os campos de um certificado; devolve { campo: mensagem } (vazio = tudo certo).
 * Título e instituição são obrigatórios; o ano é opcional (de 1950 até o ano atual,
 * como o banco confere na migration 011).
 */
export function validarCertificado({ titulo, instituicao, ano }, anoAtual = new Date().getFullYear()) {
  const erros = {}
  if (String(titulo ?? '').trim().length < 3) erros.titulo = 'Escreva o nome do curso.'
  if (String(instituicao ?? '').trim().length < 2) erros.instituicao = 'Escreva onde você fez o curso.'
  const a = String(ano ?? '').trim()
  if (a && !(/^\d{4}$/.test(a) && Number(a) >= 1950 && Number(a) <= anoAtual)) {
    erros.ano = `Digite o ano com 4 números, até ${anoAtual}, ou deixe em branco.`
  }
  return erros
}

import { beforeEach, describe, expect, it, vi } from 'vitest'

/*
 * Supabase simulado: guarda a ordem das chamadas (envio, cadastro, remoção de arquivo)
 * para conferir que a imagem antiga só é apagada depois que o cadastro deu certo e que
 * nenhum arquivo fica solto quando algo falha. A demonstração bloqueia envios, então
 * este caminho só pode ser testado assim.
 */
const simulado = vi.hoisted(() => {
  const estado = { chamadas: [], respostaBanco: null, erroEnvio: null }
  const consulta = {
    insert: (campos) => (estado.chamadas.push(['insert', campos]), consulta),
    update: (campos) => (estado.chamadas.push(['update', campos]), consulta),
    delete: () => (estado.chamadas.push(['delete']), consulta),
    eq: () => consulta,
    select: () => consulta,
    then: (ok, falha) => Promise.resolve(estado.respostaBanco).then(ok, falha),
  }
  const supabase = {
    from: () => consulta,
    storage: {
      from: () => ({
        upload: async (caminho) => (estado.chamadas.push(['upload', caminho]), { error: estado.erroEnvio }),
        getPublicUrl: (caminho) => ({ data: { publicUrl: `https://exemplo.supabase.co/${caminho}` } }),
        remove: async ([caminho]) => (estado.chamadas.push(['remove', caminho]), { error: null }),
      }),
    },
  }
  return { estado, supabase }
})

vi.mock('./supabase', () => ({ supabase: simulado.supabase }))

const { removerCertificado, salvarCertificado } = await import('./consultasCadastros')
const { estado } = simulado

const FOTO = { blob: new Blob(['x']), tipo: 'image/webp', extensao: 'webp' }
const BASE = { titulo: ' Design de sobrancelhas ', instituicao: 'Escola X', ano: 2020, ordem: 3 }
const tipos = () => estado.chamadas.map((c) => c[0])

beforeEach(() => {
  estado.chamadas = []
  estado.respostaBanco = { data: [{ id: 'c1' }], error: null }
  estado.erroEnvio = null
})

describe('salvarCertificado', () => {
  it('novo sem imagem: só cadastra, com o texto sem espaços sobrando', async () => {
    await salvarCertificado(BASE)
    expect(tipos()).toEqual(['insert'])
    expect(estado.chamadas[0][1]).toEqual({ titulo: 'Design de sobrancelhas', instituicao: 'Escola X', ano: 2020, ordem: 3 })
  })

  it('novo com imagem: envia para certificados/ antes de cadastrar', async () => {
    await salvarCertificado(BASE, { foto: FOTO })
    expect(tipos()).toEqual(['upload', 'insert'])
    const caminho = estado.chamadas[0][1]
    expect(caminho).toMatch(/^certificados\/.+\.webp$/)
    expect(estado.chamadas[1][1]).toMatchObject({ caminho_storage: caminho, imagem_url: `https://exemplo.supabase.co/${caminho}` })
  })

  it('trocar a imagem: envia a nova, atualiza e só então apaga a antiga', async () => {
    await salvarCertificado({ ...BASE, id: 'c1', caminhoAntigo: 'certificados/antiga.webp' }, { foto: FOTO })
    expect(tipos()).toEqual(['upload', 'update', 'remove'])
    expect(estado.chamadas[2][1]).toBe('certificados/antiga.webp')
  })

  it('tirar a imagem: limpa os campos e apaga o arquivo', async () => {
    await salvarCertificado({ ...BASE, id: 'c1', caminhoAntigo: 'certificados/antiga.webp' }, { remover: true })
    expect(tipos()).toEqual(['update', 'remove'])
    expect(estado.chamadas[0][1]).toMatchObject({ imagem_url: null, caminho_storage: null })
  })

  it('editar só o texto: não mexe na imagem', async () => {
    await salvarCertificado({ ...BASE, id: 'c1', caminhoAntigo: 'certificados/antiga.webp' })
    expect(tipos()).toEqual(['update'])
    expect(estado.chamadas[0][1]).not.toHaveProperty('caminho_storage')
  })

  it('cadastro recusado: apaga a imagem nova e mantém a antiga; regra do banco vira mensagem em português', async () => {
    estado.respostaBanco = { data: null, error: { code: 'P0001', message: 'O ano do certificado não pode ser depois deste ano.' } }
    const erro = await salvarCertificado({ ...BASE, id: 'c1', caminhoAntigo: 'certificados/antiga.webp' }, { foto: FOTO }).catch((e) => e)
    expect(erro.amigavel).toBe(true)
    expect(erro.message).toMatch(/ano do certificado/)
    expect(tipos()).toEqual(['upload', 'update', 'remove'])
    expect(estado.chamadas[2][1]).toBe(estado.chamadas[0][1]) // apagou a NOVA, não a antiga
  })

  it('envio da imagem falhou: não cadastra nada', async () => {
    estado.erroEnvio = { message: 'falhou' }
    await expect(salvarCertificado(BASE, { foto: FOTO })).rejects.toBeTruthy()
    expect(tipos()).toEqual(['upload'])
  })
})

describe('removerCertificado', () => {
  it('apaga o certificado e depois a imagem dele', async () => {
    await removerCertificado({ id: 'c1', caminho_storage: 'certificados/x.webp' })
    expect(tipos()).toEqual(['delete', 'remove'])
  })

  it('nunca apaga um arquivo fora da pasta certificados/', async () => {
    await removerCertificado({ id: 'c1', caminho_storage: 'perfil/marlene-souza.webp' })
    expect(tipos()).toEqual(['delete'])
  })

  it('sem imagem: só apaga o certificado', async () => {
    await removerCertificado({ id: 'c1', caminho_storage: null })
    expect(tipos()).toEqual(['delete'])
  })
})

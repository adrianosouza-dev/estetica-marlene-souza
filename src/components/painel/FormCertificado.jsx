import { useEffect, useId, useState } from 'react'
import { MODO_DEMO } from '../../config/demo'
import { salvarCertificado } from '../../lib/consultasCadastros'
import { textoDoErro } from '../../lib/erros'
import { validarCertificado } from '../../lib/edicao'
import { prepararFoto } from '../../lib/imagens'
import { Aviso } from '../ui/Aviso'
import { Botao } from '../ui/Botao'
import { Campo } from '../ui/Campo'

const ANO_ATUAL = new Date().getFullYear()

/**
 * Criar (certificado = null) ou editar um certificado.
 * A imagem é opcional: é reduzida, convertida para .webp e perde a localização
 * no próprio celular, como as fotos da galeria (src/lib/imagens.js).
 */
export function FormCertificado({ certificado, proximaOrdem, aoSalvar, aoCancelar }) {
  const idArquivo = useId()
  const [dados, setDados] = useState({
    titulo: certificado?.titulo ?? '',
    instituicao: certificado?.instituicao ?? '',
    ano: certificado?.ano ? String(certificado.ano) : '',
  })
  const [arquivo, setArquivo] = useState(null)
  const [previa, setPrevia] = useState(null)
  const [tirarImagem, setTirarImagem] = useState(false)
  const [erros, setErros] = useState({})
  const [etapa, setEtapa] = useState(null) // null | 'preparando' | 'salvando'
  const [erroEnvio, setErroEnvio] = useState(null)

  // A prévia usa um endereço temporário do arquivo; ao trocar de imagem ou sair, o antigo é liberado
  useEffect(() => () => previa && URL.revokeObjectURL(previa), [previa])

  const imagemAtual = !tirarImagem && certificado?.imagem_url
  const imagemMostrada = previa || imagemAtual

  function alterar(campo, valor) {
    setDados((d) => ({ ...d, [campo]: valor }))
    setErros((e) => ({ ...e, [campo]: undefined }))
  }

  function escolher(novo) {
    setArquivo(novo)
    setPrevia(novo ? URL.createObjectURL(novo) : null)
    if (novo) setTirarImagem(false)
    setErroEnvio(null)
  }

  function semImagem() {
    escolher(null)
    setTirarImagem(true)
  }

  async function salvar(evento) {
    evento.preventDefault()
    const encontrados = validarCertificado(dados)
    setErros(encontrados)
    if (Object.keys(encontrados).length) return

    setErroEnvio(null)
    try {
      let imagem = {}
      if (arquivo) {
        setEtapa('preparando')
        imagem = { foto: await prepararFoto(arquivo) }
      } else if (tirarImagem && certificado?.caminho_storage) {
        imagem = { remover: true }
      }
      setEtapa('salvando')
      await salvarCertificado(
        {
          id: certificado?.id,
          ...dados,
          ano: dados.ano ? Number(dados.ano) : null,
          ordem: proximaOrdem,
          caminhoAntigo: certificado?.caminho_storage,
        },
        imagem,
      )
      aoSalvar()
    } catch (erro) {
      console.error(erro)
      setErroEnvio(textoDoErro(erro))
      setEtapa(null)
    }
  }

  return (
    <form className="formulario formulario--painel" onSubmit={salvar} noValidate>
      <Campo
        rotulo="Nome do curso"
        dica="Ex.: Manicure e pedicure profissional"
        maxLength={150}
        value={dados.titulo}
        onChange={(e) => alterar('titulo', e.target.value)}
        erro={erros.titulo}
      />
      <Campo
        rotulo="Instituição"
        dica="Onde você fez o curso."
        maxLength={150}
        value={dados.instituicao}
        onChange={(e) => alterar('instituicao', e.target.value)}
        erro={erros.instituicao}
      />
      <Campo
        rotulo="Ano"
        opcional
        inputMode="numeric"
        maxLength={4}
        placeholder={String(ANO_ATUAL)}
        value={dados.ano}
        onChange={(e) => alterar('ano', e.target.value.replace(/\D/g, ''))}
        erro={erros.ano}
      />

      <fieldset className="campo certificado-imagem">
        <legend className="campo__rotulo">
          Imagem do certificado <span className="campo__opcional">(opcional)</span>
        </legend>

        {MODO_DEMO ? (
          <p className="cadastro__nota">Na demonstração, não é possível enviar imagens.</p>
        ) : (
          <>
            <Aviso tipo="info">Antes de enviar, corte ou cubra CPF, RG e outros dados pessoais do certificado.</Aviso>
            <label htmlFor={idArquivo} className="seletor-foto">
              {imagemMostrada ? (
                <img src={imagemMostrada} alt={previa ? 'Prévia da imagem escolhida' : 'Imagem atual do certificado'} />
              ) : (
                <span>Toque para escolher uma imagem</span>
              )}
            </label>
            <input
              id={idArquivo}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => escolher(e.target.files?.[0] ?? null)}
            />
            {imagemMostrada && (
              <div className="certificado-imagem__acoes">
                <label htmlFor={idArquivo} className="botao-texto">
                  Escolher outra imagem
                </label>
                <button type="button" className="botao-texto" onClick={semImagem}>
                  Tirar a imagem
                </button>
              </div>
            )}
          </>
        )}
      </fieldset>

      {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}

      <div className="modal__acoes">
        <Botao type="submit" disabled={Boolean(etapa)}>
          {etapa === 'preparando' ? 'Preparando a imagem…' : etapa === 'salvando' ? 'Salvando…' : 'Salvar certificado'}
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar} disabled={Boolean(etapa)}>
          Voltar
        </Botao>
      </div>
    </form>
  )
}

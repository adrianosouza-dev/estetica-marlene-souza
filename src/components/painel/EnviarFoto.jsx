import { useEffect, useId, useState } from 'react'
import { textoDoErro } from '../../lib/erros'
import { prepararFoto } from '../../lib/imagens'
import { Aviso } from '../ui/Aviso'
import { Botao } from '../ui/Botao'
import { Campo } from '../ui/Campo'

/**
 * Escolher uma foto (câmera ou galeria do celular), ver a prévia, escrever a
 * legenda e enviar. A foto é reduzida, convertida para .webp e perde a
 * localização no próprio celular, antes do envio (src/lib/imagens.js).
 *
 * enviar(foto, legenda): função que manda a foto preparada (galeria ou perfil)
 * comLegenda: mostra o campo de legenda (a foto do perfil não tem)
 */
export function EnviarFoto({ enviar: enviarPreparada, comLegenda = true, rotuloEnviar = 'Enviar foto', aoEnviar, aoCancelar }) {
  const idArquivo = useId()
  const [arquivo, setArquivo] = useState(null)
  const [previa, setPrevia] = useState(null)
  const [legenda, setLegenda] = useState('')
  const [etapa, setEtapa] = useState(null) // null | 'preparando' | 'enviando'
  const [erro, setErro] = useState(null)

  // A prévia usa um endereço temporário do arquivo; ao trocar de foto ou sair, o antigo é liberado
  useEffect(() => () => previa && URL.revokeObjectURL(previa), [previa])

  function escolher(novo) {
    setArquivo(novo)
    setPrevia(novo ? URL.createObjectURL(novo) : null)
    setErro(null)
  }

  async function enviar(evento) {
    evento.preventDefault()
    if (!arquivo) {
      setErro('Escolha uma foto primeiro.')
      return
    }
    setErro(null)
    try {
      setEtapa('preparando')
      const foto = await prepararFoto(arquivo)
      setEtapa('enviando')
      await enviarPreparada(foto, legenda)
      aoEnviar()
    } catch (e) {
      console.error(e)
      setErro(textoDoErro(e, 'Não foi possível enviar a foto. Confira sua internet e tente de novo.'))
      setEtapa(null)
    }
  }

  return (
    <form className="formulario formulario--painel" onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor={idArquivo} className="seletor-foto">
          {previa ? <img src={previa} alt="Prévia da foto escolhida" /> : <span>Toque para escolher uma foto</span>}
        </label>
        <input
          id={idArquivo}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => escolher(e.target.files?.[0] ?? null)}
        />
        {previa && (
          <label htmlFor={idArquivo} className="botao-texto seletor-foto__trocar">
            Escolher outra foto
          </label>
        )}
      </div>

      {comLegenda && (
        <Campo
          rotulo="Legenda"
          opcional
          dica="Ex.: Pedicure com flores. Também é lida para quem usa leitor de tela."
          maxLength={150}
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
        />
      )}

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <div className="modal__acoes">
        <Botao type="submit" disabled={Boolean(etapa)}>
          {etapa === 'preparando' ? 'Preparando a foto…' : etapa === 'enviando' ? 'Enviando…' : rotuloEnviar}
        </Botao>
        <Botao variante="secundario" onClick={aoCancelar} disabled={Boolean(etapa)}>
          Voltar
        </Botao>
      </div>
    </form>
  )
}

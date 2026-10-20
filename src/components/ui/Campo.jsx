import { useId } from 'react'

/**
 * Campo de formulário com rótulo, dica e mensagem de erro já ligados ao input
 * (aria-describedby), para o leitor de tela anunciar tudo junto.
 *
 * multilinha: usa <textarea> em vez de <input>.
 * Os demais props (value, onChange, maxLength...) vão direto para o campo.
 */
export function Campo({ rotulo, dica, erro, multilinha = false, opcional = false, ...resto }) {
  const id = useId()
  const idDica = dica ? `${id}-dica` : undefined
  const idErro = erro ? `${id}-erro` : undefined
  const Elemento = multilinha ? 'textarea' : 'input'

  return (
    <div className={`campo ${erro ? 'campo--erro' : ''}`}>
      <label htmlFor={id} className="campo__rotulo">
        {rotulo}
        {opcional && <span className="campo__opcional"> (opcional)</span>}
      </label>
      {dica && (
        <p id={idDica} className="campo__dica">
          {dica}
        </p>
      )}
      <Elemento
        id={id}
        className="campo__entrada"
        aria-invalid={erro ? true : undefined}
        aria-describedby={[idDica, idErro].filter(Boolean).join(' ') || undefined}
        {...resto}
      />
      {erro && (
        <p id={idErro} className="campo__erro">
          {erro}
        </p>
      )}
    </div>
  )
}

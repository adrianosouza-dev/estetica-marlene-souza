import { useState } from 'react'
import { Campo } from './Campo'

/**
 * Campo de senha com botão "Mostrar" / "Esconder".
 * Ajuda quem digita no celular a conferir a senha antes de enviar.
 */
export function CampoSenha(props) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div className="campo-senha">
      <Campo type={visivel ? 'text' : 'password'} {...props} />
      <button
        type="button"
        className="campo-senha__alternar botao-texto"
        aria-pressed={visivel}
        onClick={() => setVisivel((v) => !v)}
      >
        {visivel ? 'Esconder' : 'Mostrar'}
        <span className="sr-only"> senha</span>
      </button>
    </div>
  )
}

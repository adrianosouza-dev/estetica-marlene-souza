import { Link } from 'react-router-dom'

/**
 * Botão padrão do site.
 * - com "para": vira um link interno (React Router)
 * - com "href": vira um link externo (ex.: WhatsApp)
 * - sem nenhum dos dois: é um <button> normal
 *
 * variante: 'primario' | 'secundario' | 'discreto'
 */
export function Botao({
  variante = 'primario',
  bloco = false,
  para,
  href,
  className = '',
  children,
  ...resto
}) {
  const classes = ['botao', `botao--${variante}`, bloco && 'botao--bloco', className]
    .filter(Boolean)
    .join(' ')

  if (para) {
    return (
      <Link to={para} className={classes} {...resto}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...resto}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...resto}>
      {children}
    </button>
  )
}

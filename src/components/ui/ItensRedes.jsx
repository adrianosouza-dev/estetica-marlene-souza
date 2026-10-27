import { redesDoPerfil } from '../../lib/redes'

/*
 * Ícones simples das redes, desenhados com currentColor (herdam a cor do link).
 * São decorativos: o nome da rede vai escrito ao lado, para todos lerem.
 */
const ICONES = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.3" cy="6.7" r="1.3" fill="currentColor" />
    </>
  ),
  tiktok: (
    <path
      d="M14 3h3a4 4 0 0 0 4 4v3a7 7 0 0 1-4-1.3V15a6 6 0 1 1-6-6v3.2a2.8 2.8 0 1 0 3 2.8Z"
      fill="currentColor"
    />
  ),
  facebook: (
    <path
      d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4a21 21 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.1H7.7v3h2.6V21Z"
      fill="currentColor"
    />
  ),
}

/**
 * Itens (<li>) com os links das redes preenchidas no perfil, para entrar numa
 * lista que já existe (rodapé, Contato). Sem nenhuma rede, não mostra nada.
 * comUsuario: mostra o @ ao lado do nome (página Contato); no rodapé, só o nome.
 */
export function ItensRedes({ instagram, tiktok, facebook, comUsuario = false }) {
  return redesDoPerfil({ instagram, tiktok, facebook }).map((r) => (
    <li key={r.rede}>
      <a className="link-rede" href={r.link} target="_blank" rel="noopener noreferrer">
        <svg className="link-rede__icone" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          {ICONES[r.rede]}
        </svg>
        <span>
          {r.nome}
          {comUsuario && r.usuario && <span className="link-rede__usuario"> {r.usuario}</span>}
        </span>
      </a>
    </li>
  ))
}

import { useEffect } from 'react'
import { MODO_DEMO } from '../config/demo'
import { negocio } from '../config/negocio'

/**
 * Atualiza o título da aba do navegador.
 * Ajuda quem usa leitor de tela a saber em que página está e melhora o SEO.
 */
export function useTituloPagina(titulo) {
  useEffect(() => {
    const base = titulo
      ? `${titulo} · ${negocio.nome}`
      : `${negocio.nome} · ${negocio.especialidade} em ${negocio.endereco.cidade}`
    document.title = MODO_DEMO ? `${base} (demonstração)` : base
  }, [titulo])
}

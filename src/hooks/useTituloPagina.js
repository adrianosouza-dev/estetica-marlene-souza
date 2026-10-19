import { useEffect } from 'react'
import { negocio } from '../config/negocio'

/**
 * Atualiza o título da aba do navegador.
 * Ajuda quem usa leitor de tela a saber em que página está e melhora o SEO.
 */
export function useTituloPagina(titulo) {
  useEffect(() => {
    document.title = titulo
      ? `${titulo} · ${negocio.nome}`
      : `${negocio.nome} · ${negocio.especialidade} em ${negocio.endereco.cidade}`
  }, [titulo])
}

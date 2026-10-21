import { useCallback, useEffect, useState } from 'react'

/**
 * Roda uma função de busca (src/lib/consultas.js) e acompanha o estado:
 * { dados, carregando, erro, recarregar }.
 *
 * Passe a função em si (ex.: buscarFotos) e, se precisar, um argumento: um valor
 * simples (ex.: 4 ou '2026-10-23') ou um objeto de filtros. A busca só se
 * repete quando o conteúdo do argumento muda, não a cada renderização.
 *
 * Enquanto busca:
 *   - recarregar() (mesmo argumento): os dados atuais continuam na tela;
 *   - argumento novo (ex.: outro dia): dados = null, para não mostrar por um
 *     instante os dados errados. Com { manterAnteriores: true }, mantém também
 *     nesse caso (ex.: "Carregar mais" no histórico).
 */
export function useConsulta(buscar, argumento, { manterAnteriores = false } = {}) {
  const [versao, setVersao] = useState(0)
  const [resultado, setResultado] = useState({ chave: null, argumentoTexto: null, dados: null, erro: null })

  // O argumento vira texto: a busca só se repete quando o CONTEÚDO muda,
  // não quando um objeto igual é recriado a cada renderização
  const argumentoTexto = JSON.stringify(argumento ?? null)
  // Identifica a busca atual; o resultado só vale se for da mesma chave
  const chave = `${argumentoTexto}#${versao}`

  useEffect(() => {
    let ativo = true // evita atualizar a tela depois que o componente saiu

    buscar(JSON.parse(argumentoTexto))
      .then((dados) => ativo && setResultado({ chave, argumentoTexto, dados, erro: null }))
      .catch((erro) => {
        console.error(erro)
        if (ativo) setResultado({ chave, argumentoTexto, dados: null, erro })
      })

    return () => {
      ativo = false
    }
  }, [buscar, argumentoTexto, chave])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])
  const carregando = resultado.chave !== chave
  const mesmoArgumento = resultado.argumentoTexto === argumentoTexto
  const mostrarAnteriores = !carregando || mesmoArgumento || manterAnteriores

  return {
    dados: mostrarAnteriores ? resultado.dados : null,
    erro: carregando ? null : resultado.erro,
    carregando,
    recarregar,
  }
}

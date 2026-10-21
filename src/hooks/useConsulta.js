import { useCallback, useEffect, useState } from 'react'

/**
 * Roda uma função de busca (src/lib/consultas.js) e acompanha o estado:
 * { dados, carregando, erro, recarregar }.
 *
 * Passe a função em si (ex.: buscarFotos) e, se precisar, um argumento simples
 * (ex.: 4 ou '2026-10-23'). Assim a busca não se repete a cada renderização.
 * Quando o argumento muda, volta a "carregando" na hora, sem mostrar por um
 * instante os dados da busca anterior.
 */
export function useConsulta(buscar, argumento) {
  const [versao, setVersao] = useState(0)
  const [resultado, setResultado] = useState({ chave: null, dados: null, erro: null })

  // Identifica a busca atual; o resultado só vale se for da mesma chave
  const chave = `${String(argumento)}#${versao}`

  useEffect(() => {
    let ativo = true // evita atualizar a tela depois que o componente saiu

    buscar(argumento)
      .then((dados) => ativo && setResultado({ chave, dados, erro: null }))
      .catch((erro) => {
        console.error(erro)
        if (ativo) setResultado({ chave, dados: null, erro })
      })

    return () => {
      ativo = false
    }
  }, [buscar, argumento, chave])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])
  const carregando = resultado.chave !== chave

  return {
    dados: carregando ? null : resultado.dados,
    erro: carregando ? null : resultado.erro,
    carregando,
    recarregar,
  }
}

import { useEffect, useState } from 'react'

/**
 * Roda uma função de busca (src/lib/consultas.js) e acompanha o estado:
 * { dados, carregando, erro }.
 *
 * Passe a função em si (ex.: buscarFotos) e, se precisar, um argumento simples
 * (ex.: 4). Assim a busca não se repete a cada renderização.
 */
export function useConsulta(buscar, argumento) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null })

  useEffect(() => {
    let ativo = true // evita atualizar a tela depois que o componente saiu

    buscar(argumento)
      .then((dados) => ativo && setEstado({ dados, carregando: false, erro: null }))
      .catch((erro) => {
        console.error(erro)
        if (ativo) setEstado({ dados: null, carregando: false, erro })
      })

    return () => {
      ativo = false
    }
  }, [buscar, argumento])

  return estado
}

import { useMemo } from 'react'
import { enderecoCompleto, negocio } from '../../config/negocio'
import { useConsulta } from '../../hooks/useConsulta'
import { NegocioContexto } from '../../hooks/useNegocio'
import { buscarDadosNegocio } from '../../lib/consultas'
import { resumirHorarios } from '../../lib/formatadores'

/**
 * Junta o que vem do banco com os valores de reserva de src/config/negocio.js.
 * O que a Marlene preencher no painel sempre tem prioridade.
 */
function montarNegocio(perfil, horarios) {
  const endereco = perfil?.endereco || enderecoCompleto()
  const temHorarios = horarios?.some((h) => h.aberto)

  return {
    nome: negocio.nome,
    especialidade: negocio.especialidade,
    frase: negocio.frase,
    descricao: negocio.descricao,
    endereco,
    linkMapa:
      perfil?.link_mapa ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`,
    whatsapp: perfil?.whatsapp || negocio.whatsapp,
    instagram: perfil?.instagram || negocio.instagram,
    sobre: perfil?.sobre || '',
    fotoUrl: perfil?.foto_url || null,
    horarios: horarios ?? [],
    horarioResumo: temHorarios ? resumirHorarios(horarios) : negocio.horarioResumo,
  }
}

export function ProvedorNegocio({ children }) {
  const { dados, carregando, erro } = useConsulta(buscarDadosNegocio)

  const valor = useMemo(
    () => ({ ...montarNegocio(dados?.perfil, dados?.horarios), carregando, erro }),
    [dados, carregando, erro],
  )

  return <NegocioContexto.Provider value={valor}>{children}</NegocioContexto.Provider>
}

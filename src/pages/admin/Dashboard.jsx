import { useLocation } from 'react-router-dom'
import { Aviso } from '../../components/ui/Aviso'
import { useTituloPagina } from '../../hooks/useTituloPagina'

// Conteúdo completo na Fase 6.
export default function Dashboard() {
  useTituloPagina('Painel')
  const aviso = useLocation().state?.aviso // ex.: "Senha alterada." vindo de /admin/nova-senha

  return (
    <section className="container pagina">
      {aviso && <Aviso tipo="sucesso">{aviso}</Aviso>}
      <h1>Painel</h1>
      <p className="texto-suave">Resumo do dia, próximos horários e avaliações pendentes.</p>
    </section>
  )
}

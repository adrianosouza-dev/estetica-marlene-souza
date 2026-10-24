import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { LayoutAdmin } from '../../components/layout/LayoutAdmin'
import { ProvedorAuth } from '../../components/layout/ProvedorAuth'
import { RotaProtegida } from '../../components/layout/RotaProtegida'
import Login from './Login'
import NovaSenha from './NovaSenha'

import '../../styles/admin.css'
import '../../styles/painel.css'
import '../../styles/cadastros.css'

/*
 * Tudo o que fica em /admin: login, nova senha e painel.
 * O App carrega este arquivo sob demanda, então as clientes não baixam o
 * código nem o CSS do painel. O login vem junto (é a porta de entrada); as
 * páginas do painel carregam uma a uma, quando a Marlene abre cada uma.
 */
const Dashboard = lazy(() => import('./Dashboard'))
const Agenda = lazy(() => import('./Agenda'))
const Historico = lazy(() => import('./Historico'))
const Servicos = lazy(() => import('./Servicos'))
const Horarios = lazy(() => import('./Horarios'))
const Fotos = lazy(() => import('./Fotos'))
const Avaliacoes = lazy(() => import('./Avaliacoes'))
const Perfil = lazy(() => import('./Perfil'))
const Perguntas = lazy(() => import('./Perguntas'))

export default function RotasAdmin() {
  return (
    // O login é acompanhado só aqui dentro: o site das clientes não precisa dele
    <ProvedorAuth>
      <Suspense
        fallback={
          <p className="carregando container" role="status">
            Carregando…
          </p>
        }
      >
        <Routes>
          {/* Abertas: ficam fora do layout do painel */}
          <Route path="login" element={<Login />} />
          <Route path="nova-senha" element={<NovaSenha />} />

          {/* Painel: só para a profissional logada */}
          <Route element={<RotaProtegida />}>
            <Route element={<LayoutAdmin />}>
              <Route index element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="historico" element={<Historico />} />
              <Route path="servicos" element={<Servicos />} />
              <Route path="horarios" element={<Horarios />} />
              <Route path="fotos" element={<Fotos />} />
              <Route path="avaliacoes" element={<Avaliacoes />} />
              <Route path="perguntas" element={<Perguntas />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ProvedorAuth>
  )
}

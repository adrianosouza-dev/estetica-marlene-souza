import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AreaAdmin } from './components/layout/AreaAdmin'
import { LayoutAdmin } from './components/layout/LayoutAdmin'
import { LayoutPublico } from './components/layout/LayoutPublico'
import { RotaProtegida } from './components/layout/RotaProtegida'

import Agendar from './pages/publico/Agendar'
import Avaliar from './pages/publico/Avaliar'
import Contato from './pages/publico/Contato'
import Galeria from './pages/publico/Galeria'
import Inicio from './pages/publico/Inicio'
import NaoEncontrada from './pages/publico/NaoEncontrada'
import Perguntas from './pages/publico/Perguntas'
import Servicos from './pages/publico/Servicos'
import Sobre from './pages/publico/Sobre'

/*
 * As páginas do painel são carregadas sob demanda (lazy).
 * Assim, as clientes no celular não baixam o código do admin.
 */
const Login = lazy(() => import('./pages/admin/Login'))
const NovaSenha = lazy(() => import('./pages/admin/NovaSenha'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Agenda = lazy(() => import('./pages/admin/Agenda'))
const Historico = lazy(() => import('./pages/admin/Historico'))
const AdminServicos = lazy(() => import('./pages/admin/Servicos'))
const Horarios = lazy(() => import('./pages/admin/Horarios'))
const Fotos = lazy(() => import('./pages/admin/Fotos'))
const Avaliacoes = lazy(() => import('./pages/admin/Avaliacoes'))
const Perfil = lazy(() => import('./pages/admin/Perfil'))
const AdminPerguntas = lazy(() => import('./pages/admin/Perguntas'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Site das clientes */}
        <Route element={<LayoutPublico />}>
          <Route index element={<Inicio />} />
          <Route path="servicos" element={<Servicos />} />
          <Route path="galeria" element={<Galeria />} />
          <Route path="agendar" element={<Agendar />} />
          <Route path="sobre" element={<Sobre />} />
          <Route path="contato" element={<Contato />} />
          <Route path="perguntas" element={<Perguntas />} />
          <Route path="avaliar" element={<Avaliar />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Route>

        {/* Área da profissional: o login é acompanhado só aqui dentro */}
        <Route path="admin" element={<AreaAdmin />}>
          {/* Abertas: ficam fora do layout do painel */}
          <Route path="login" element={<Login />} />
          <Route path="nova-senha" element={<NovaSenha />} />

          {/* Painel: só para a profissional logada */}
          <Route element={<RotaProtegida />}>
            <Route element={<LayoutAdmin />}>
              <Route index element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="historico" element={<Historico />} />
              <Route path="servicos" element={<AdminServicos />} />
              <Route path="horarios" element={<Horarios />} />
              <Route path="fotos" element={<Fotos />} />
              <Route path="avaliacoes" element={<Avaliacoes />} />
              <Route path="perguntas" element={<AdminPerguntas />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

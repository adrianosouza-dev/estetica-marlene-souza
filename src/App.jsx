import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

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
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Agenda = lazy(() => import('./pages/admin/Agenda'))
const Historico = lazy(() => import('./pages/admin/Historico'))
const AdminServicos = lazy(() => import('./pages/admin/Servicos'))
const Horarios = lazy(() => import('./pages/admin/Horarios'))
const Fotos = lazy(() => import('./pages/admin/Fotos'))
const Avaliacoes = lazy(() => import('./pages/admin/Avaliacoes'))
const Perfil = lazy(() => import('./pages/admin/Perfil'))

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

        {/* Login fica fora do layout do painel */}
        <Route
          path="admin/login"
          element={
            <Suspense fallback={<p className="carregando">Carregando…</p>}>
              <Login />
            </Suspense>
          }
        />

        {/* Painel da profissional */}
        <Route path="admin" element={<RotaProtegida />}>
          <Route element={<LayoutAdmin />}>
            <Route index element={<Dashboard />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="historico" element={<Historico />} />
            <Route path="servicos" element={<AdminServicos />} />
            <Route path="horarios" element={<Horarios />} />
            <Route path="fotos" element={<Fotos />} />
            <Route path="avaliacoes" element={<Avaliacoes />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

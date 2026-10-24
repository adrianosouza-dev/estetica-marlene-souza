import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { LayoutPublico } from './components/layout/LayoutPublico'

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
 * Toda a área /admin (login, painel e o CSS dele) é carregada sob demanda.
 * Assim, as clientes no celular não baixam o código do admin.
 */
const RotasAdmin = lazy(() => import('./pages/admin/RotasAdmin'))

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

        {/* Área da profissional: as rotas ficam em pages/admin/RotasAdmin.jsx */}
        <Route
          path="admin/*"
          element={
            <Suspense
              fallback={
                <p className="carregando container" role="status">
                  Carregando…
                </p>
              }
            >
              <RotasAdmin />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

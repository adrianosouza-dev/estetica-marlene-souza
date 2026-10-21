import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './styles/tokens.css'
import './styles/global.css'
import './styles/layout.css'
import './styles/componentes.css'
import './styles/paginas.css'
import './styles/agendamento.css'
import './styles/admin.css'
import './styles/painel.css'

import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

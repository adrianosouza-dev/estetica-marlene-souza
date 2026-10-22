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
import './styles/cadastros.css'

import App from './App'
import { MODO_DEMO } from './config/demo'

// Site de demonstração: pede aos buscadores para não indexar, para ele nunca
// aparecer no Google no lugar do site real da Marlene
if (MODO_DEMO) {
  const robos = document.createElement('meta')
  robos.name = 'robots'
  robos.content = 'noindex, nofollow'
  document.head.append(robos)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

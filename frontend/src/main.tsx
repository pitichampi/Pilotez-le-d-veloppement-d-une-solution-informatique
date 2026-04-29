import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from '@hooks/useAuth'
import App from './App'

/**
 * Point d'entrée de l'application React
 *
 * Structure :
 * - React 18 : Racine avec StrictMode pour détecter les problèmes en développement
 * - AuthProvider : Context global pour l'authentification (JWT, utilisateur courant)
 * - App : Composant racine avec routing
 *
 * StrictMode :
 * - Détecte les side effects indésirables
 * - Monte/démonte deux fois les composants en développement (normal)
 * - Aide à identifier les bugs
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)


import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@pages/LoginPage'
import { RegisterPage } from '@pages/RegisterPage'
import { HomePage } from '@pages/HomePage'
import { DownloadPage } from '@pages/DownloadPage'
import { Layout } from '@components/Layout'
import { ProtectedRoute } from '@components/ProtectedRoute'
import './index.css'

/**
 * Composant racine de l'application DataShare
 * 
 * Architecture :
 * - Utilise React Router pour la navigation client-side
 * - Protège les routes utilisateur avec ProtectedRoute (vérification JWT)
 * - Pages publiques accessible sans authentification
 *
 * Routes :
 * - /login → Authentification (email/password)
 * - /register → Inscription (email/password)
 * - / → Accueil utilisateur (upload, historique) [protégée]
 * - /download/:token → Téléchargement public (sans auth)
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route de connexion - accessible sans authentification */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route d'inscription - accessible sans authentification */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Route privée - accueil utilisateur avec upload et historique */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <HomePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Route publique - téléchargement de fichiers via lien partagé */}
        <Route path="/download/:token" element={<DownloadPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

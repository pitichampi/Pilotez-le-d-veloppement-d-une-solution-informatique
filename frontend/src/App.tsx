import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@pages/LoginPage'
import { RegisterPage } from '@pages/RegisterPage'
import { HomePage } from '@pages/HomePage'
import { LandingPage } from '@pages/LandingPage'
import { DownloadPage } from '@pages/DownloadPage'
import { Layout } from '@components/Layout'
import { ProtectedRoute } from '@components/ProtectedRoute'
import { useAuth } from '@hooks/useAuth'
import './index.css'

/**
 * Composant racine de l'application DataShare
 * 
 * Architecture :
 * - Utilise React Router pour la navigation client-side
 * - Affiche une landing page publique sur /
 * - Affiche le tableau de bord protégé si l'utilisateur est authentifié
 * - Pages publiques accessibles sans authentification
 *
 * Routes :
 * - / → Page d'accueil publique ou dashboard si connecté
 * - /login → Authentification (email/password)
 * - /register → Inscription (email/password)
 * - /download/:token → Téléchargement public (sans auth)
 */
const HomeWrapper = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream text-gray-600">
        Chargement...
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <ProtectedRoute>
        <Layout>
          <HomePage />
        </Layout>
      </ProtectedRoute>
    )
  }

  return <LandingPage />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route de connexion - accessible sans authentification */}
        <Route path="/login" element={<LoginPage />} />

        {/* Route d'inscription - accessible sans authentification */}
        <Route path="/register" element={<RegisterPage />} />

        {/* Route racine - public si non connecté, dashboard si connecté */}
        <Route path="/" element={<HomeWrapper />} />

        {/* Route publique - téléchargement de fichiers via lien partagé */}
        <Route path="/d/:token" element={<DownloadPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

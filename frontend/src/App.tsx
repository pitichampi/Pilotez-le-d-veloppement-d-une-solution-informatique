import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@pages/LoginPage'
import { HomePage } from '@pages/HomePage'
import { DownloadPage } from '@pages/DownloadPage'
import { Layout } from '@components/Layout'
import { ProtectedRoute } from '@components/ProtectedRoute'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
        <Route path="/download/:token" element={<DownloadPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

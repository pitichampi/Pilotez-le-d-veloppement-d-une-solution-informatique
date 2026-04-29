import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Alert, AlertDescription } from '@components/ui/Alert'
import { Loader } from '@components/ui/Loader'
import { Download, FileText, Calendar, Shield, AlertCircle } from 'lucide-react'
import { getFileMetadata, downloadFile } from '@api/index'

interface FileMetadata {
  id: string
  uploadToken: string
  originalName: string
  size: number
  mimetype: string
  createdAt: string
  expiresAt: string | null
  isPasswordProtected: boolean
}

export function DownloadPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [metadata, setMetadata] = useState<FileMetadata | null>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token de fichier manquant')
      setLoading(false)
      return
    }

    loadFileMetadata()
  }, [token])

  const loadFileMetadata = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getFileMetadata(token!)
      setMetadata(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fichier introuvable ou lien expiré')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!metadata) return

    try {
      setDownloading(true)
      setError(null)

      const response = await downloadFile(metadata.uploadToken, password || undefined)

      // Créer un blob et déclencher le téléchargement
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = metadata.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-600">Chargement du fichier...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Fichier introuvable</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!metadata) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Télécharger le fichier
            </h1>
            <p className="text-gray-600">
              Fichier partagé via DataShare
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {metadata.originalName}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Type: {metadata.mimetype}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Download className="h-4 w-4 mr-2" />
                  <span>Taille: {formatFileSize(metadata.size)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Upload: {formatDate(metadata.createdAt)}</span>
                </div>
                {metadata.expiresAt && (
                  <div className="flex items-center text-gray-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Expire: {formatDate(metadata.expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {metadata.isPasswordProtected && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Ce fichier est protégé par un mot de passe.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {metadata.isPasswordProtected && (
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe requis
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe"
                className="w-full"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              disabled={downloading || (metadata.isPasswordProtected && !password.trim())}
              className="flex-1"
              size="lg"
            >
              {downloading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Télécharger
                </>
              )}
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
            >
              Annuler
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

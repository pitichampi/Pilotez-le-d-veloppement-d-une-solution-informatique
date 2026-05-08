import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { GlobalLayout } from '@components/GlobalLayout'
import { Card } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Alert, AlertDescription } from '@components/ui/Alert'
import { Loader } from '@components/ui/Loader'
import { Download, FileText, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { getFileMetadata, downloadFile } from '@api/index'

/**
 * Interface pour les métadonnées du fichier
 * Récupérées via GET /api/files/{token}
 */
interface FileMetadata {
  original_name: string           // Nom original du fichier
  size_bytes: number              // Taille en bytes
  mime_type: string               // Type MIME (application/pdf, image/png, etc.)
  expires_at: string | null       // Date d'expiration ou null
  has_password: boolean           // Indique si fichier protégé par mot de passe
}

/**
 * Page de téléchargement public (US02)
 * Accessible via /download/{uploadToken}
 *
 * Fonctionnalités :
 * - Affichage des métadonnées du fichier (nom, taille, type)
 * - Gestion des fichiers protégés par mot de passe
 * - Téléchargement sécurisé (POST, mot de passe dans le body)
 * - Gestion des erreurs (fichier expiré, introuvable, mot de passe incorrect)
 * - Design responsive avec TailwindCSS
 *
 * États :
 * - loading : Chargement des métadonnées
 * - downloading : Téléchargement en cours
 * - error : Messages d'erreur
 * - metadata : Données du fichier
 * - password : Mot de passe saisi par l'utilisateur
 */
export function DownloadPage() {
  // Récupérer le token depuis l'URL (/download/:token)
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  // États du composant
  const [metadata, setMetadata] = useState<FileMetadata | null>(null)  // Métadonnées du fichier
  const [password, setPassword] = useState('')                         // Mot de passe saisi
  const [loading, setLoading] = useState(true)                         // Chargement des métadonnées
  const [downloading, setDownloading] = useState(false)                // Téléchargement en cours
  const [fetchError, setFetchError] = useState<string | null>(null)     // Erreur de chargement du fichier
  const [downloadError, setDownloadError] = useState<string | null>(null) // Erreur de téléchargement

  /**
   * Effect : Charger les métadonnées du fichier au montage du composant
   * Déclenche l'appel API GET /api/files/share/{token}/metadata
   */
  useEffect(() => {
    if (!token) {
      setFetchError('Token de fichier manquant')
      setLoading(false)
      return
    }

    loadFileMetadata()
  }, [token])

  /**
   * Charge les métadonnées du fichier via l'API
   * GET /api/files/share/{uploadToken}/metadata
   *
   * Erreurs gérées :
   * - 404 : Fichier introuvable
   * - 410 : Fichier expiré
   * - Autres : Messages d'erreur génériques
   */
  const loadFileMetadata = async () => {
    try {
      setLoading(true)
      setFetchError(null)
      setDownloadError(null)
      const data = await getFileMetadata(token!)
      setMetadata(data)
    } catch (err: any) {
      setFetchError(err.response?.data?.message || 'Fichier introuvable ou lien expiré')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Télécharge le fichier depuis l'API
   * POST /api/files/share/{uploadToken}/download
   *
   * Processus :
   * 1. Appel API avec mot de passe (optionnel)
   * 2. Récupération du buffer binaire
   * 3. Création d'un Blob
   * 4. Déclenchement du téléchargement navigateur
   * 5. Nettoyage des ressources (URL.revokeObjectURL)
   *
   * Erreurs gérées :
   * - 401 : Mot de passe incorrect
   * - 410 : Fichier expiré
   * - Autres : Messages d'erreur serveur
   */
  const handleDownload = async () => {
    if (!metadata) return

    try {
      setDownloading(true)
      setDownloadError(null)

      const response = await downloadFile(token!, password || undefined)

      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = metadata.original_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      const status = err.response?.status
      const apiMessage = err.response?.data?.message

      if (status === 401) {
        setDownloadError('Mot de passe erronné')
      } else {
        setDownloadError(apiMessage || 'Mot de passe erronné')
      }
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

  const getExpiryState = (dateString: string) => {
    const now = new Date()
    const expiry = new Date(dateString)
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      return { label: 'Ce fichier expirera aujourd’hui.', variant: 'warning' as const }
    }

    if (diffDays === 1) {
      return { label: 'Ce fichier expirera demain.', variant: 'warning' as const }
    }

    return { label: `Ce fichier expirera dans ${diffDays} jours.`, variant: 'info' as const }
  }

  if (loading) {
    return (
      <GlobalLayout gradient showLoginButton>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <Loader size="lg" />
            <p className="mt-4 text-neutral-medium">Chargement du fichier...</p>
          </div>
        </div>
      </GlobalLayout>
    )
  }

  if (fetchError) {
    return (
      <GlobalLayout gradient showLoginButton>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md p-8">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-error-primary mb-4" />
              <h1 className="text-3xl font-bold text-neutral-dark mb-3">Lien indisponible</h1>
              <p className="text-neutral-medium mb-6">{fetchError}</p>
              <Button onClick={() => navigate('/')} variant="outline" size="lg">
                Retour à l'accueil
              </Button>
            </div>
          </Card>
        </div>
      </GlobalLayout>
    )
  }

  if (!metadata) return null

  return (
    <GlobalLayout gradient showLoginButton>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <Card className="p-10">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-neutral-dark">Télécharger un fichier</h1>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-neutral-dark">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-neutral-dark truncate">{metadata.original_name}</h2>
                  <p className="mt-2 text-sm text-neutral-medium">{formatFileSize(metadata.size_bytes)}</p>
                </div>
              </div>

              {metadata.expires_at ? (() => {
                const expiry = getExpiryState(metadata.expires_at)
                return (
                  <div
                    className={`flex items-center gap-3 rounded-[8px] px-4 py-2 text-sm ${
                      expiry.variant === 'warning'
                        ? 'bg-[#FFF5ED] border border-[#E6CBB5] text-[#AA642B]'
                        : 'bg-blue-50/90 border border-blue-100 text-blue-900'
                    }`}
                  >
                    {expiry.variant === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-[#AA642B]" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-900" />
                    )}
                    <span>{expiry.label}</span>
                  </div>
                )
              })() : null}

              {downloadError && (
                <Alert variant="destructive">
                  <AlertDescription>{downloadError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-neutral-dark">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Saisissez le mot de passe..."
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleDownload}
                disabled={downloading || (metadata.has_password && !password.trim())}
                size="md"
                className="w-full max-w-[592px] justify-center rounded-[8px] bg-[rgba(255,129,45,0.13)] border border-[rgba(205,94,20,0.5)] text-[#BA681F] hover:text-white font-normal leading-[16px] h-[40px] px-4 gap-2"
              >
                {downloading ? (
                  <>
                    <Loader size="sm" className="mr-2" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Télécharger
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </GlobalLayout>
  )
}

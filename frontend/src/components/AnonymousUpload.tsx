import { useState, useRef } from 'react'
import { useAuth } from '@hooks/useAuth'
import { filesApi } from '@api/index'
import { Card } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Alert, AlertDescription } from '@components/ui/Alert'
import { Loader } from '@components/ui/Loader'
import { ArrowLeft, FileText, ChevronDown } from 'lucide-react'

interface ShareResult {
  download_url: string
  originalName?: string
  name?: string
  size?: number
  expires_at?: string
}

interface AnonymousUploadProps {
  onBack: () => void
  shareResult?: ShareResult
}

/**
 * Composant upload anonyme (sans authentification)
 * Permet l'upload de fichiers sans créer de compte
 */
export const AnonymousUpload = ({ onBack, shareResult }: AnonymousUploadProps) => {
  const { isAuthenticated } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [expirationDays, setExpirationDays] = useState<number>(7)
  const [filePassword, setFilePassword] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setError('')
    setUploadResult(null)
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError('')
    setUploadResult(null)

    try {
      if (filePassword && filePassword.length < 8) {
        setError('Le mot de passe doit faire au moins 8 caractères')
        setIsUploading(false)
        return
      }

      const response = isAuthenticated
        ? await filesApi.upload(selectedFile, expirationDays, filePassword || undefined, undefined)
        : await filesApi.uploadAnonymous(selectedFile, expirationDays, filePassword || undefined, undefined)
      setUploadResult(response.data)
      setCopied(false)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFilePassword('')
      setExpirationDays(7)

      // Ne pas rediriger automatiquement
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de l\'upload')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCopyLink = async () => {
    const result = uploadResult || shareResult
    if (!result?.download_url) return

    try {
      await navigator.clipboard.writeText(result.download_url)
      setCopied(true)
    } catch {
      setError('Impossible de copier le lien pour le moment.')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto md:px-6 md:py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-black mb-8 hover:text-gray-700"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour
      </button>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadResult || shareResult ? (
        <Card className="shadow-soft">
          <div className="bg-white px-8 py-10 rounded-[30px]">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-slate-950">
                {uploadResult ? 'Ajouter un fichier' : 'Lien de partage'}
              </h1>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="max-w-[80px] md:max-w-none overflow-hidden md:overflow-visible whitespace-nowrap md:whitespace-normal text-ellipsis font-semibold text-slate-950">
                    {(uploadResult || shareResult)?.originalName || 
                     (uploadResult || shareResult)?.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {(uploadResult || shareResult)?.size ? `${((uploadResult || shareResult).size / 1024).toFixed(1)} Ko` : ''}
                  </p>
                </div>
              </div>
            </div>

            <p className="mb-8 text-base text-slate-950">
              {uploadResult 
                ? 'Félicitations, ton fichier sera conservé chez nous pendant une semaine !'
                : 'Voici le lien de partage de ce fichier'}
            </p>

            <div className="rounded-[20px] bg-[#F9F7F4] p-4 flex flex-col gap-3">
              <a
                href={(uploadResult || shareResult)?.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-warm break-all text-sm font-medium"
              >
                {(uploadResult || shareResult)?.download_url}
              </a>
              <button
                onClick={handleCopyLink}
                className="inline-flex h-10 items-center justify-center rounded-[12px] bg-[#FFF0E5] text-[#BA681F] font-medium transition-colors hover:bg-[#FFE4CC]"
                type="button"
              >
                {copied ? 'Lien copié' : 'Copier le lien'}
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="shadow-soft">
        <div className="bg-white px-8 py-10 rounded-[30px]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-slate-950">Ajouter un fichier</h1>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    {selectedFile ? (
                      <div>
                        <p className="max-w-[80px] md:max-w-none overflow-hidden md:overflow-visible whitespace-nowrap md:whitespace-normal text-ellipsis font-medium text-slate-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">{Math.round(selectedFile.size / 1024)} Ko</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">Aucun fichier sélectionné</p>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelection}
                  disabled={isUploading}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm font-medium text-orange-warm border border-orange-warm rounded-lg hover:bg-orange-50 transition-colors"
                >
                  Changer
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="file-password" className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <input
                id="file-password"
                type="password"
                value={filePassword}
                onChange={e => setFilePassword(e.target.value)}
                placeholder="Optionnel"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-warm focus:ring-2 focus:ring-orange-warm focus:ring-opacity-20 bg-white text-slate-900 placeholder:text-gray-400"
                disabled={isUploading}
              />
            </div>

            <div>
              <label htmlFor="expiration" className="block text-sm font-medium text-slate-700 mb-2">
                Expiration
              </label>
              <div className="relative">
                <select
                  id="expiration"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                  disabled={isUploading}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-warm focus:ring-2 focus:ring-orange-warm focus:ring-opacity-20 bg-white text-slate-900 appearance-none cursor-pointer"
                >
                  <option value={1}>Une journée</option>
                  <option value={2}>2 jours</option>
                  <option value={3}>3 jours</option>
                  <option value={4}>4 jours</option>
                  <option value={5}>5 jours</option>
                  <option value={6}>6 jours</option>
                  <option value={7}>7 jours</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />
              </div>
            </div>

            <Button
              onClick={handleFileUpload}
              disabled={isUploading || !selectedFile}
              className="w-full border-orange-warm bg-orange-50 text-orange-warm hover:bg-orange-100"
              variant="outline"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Téléversement...
                </>
              ) : (
                'Téléverser'
              )}
            </Button>
          </div>
        </div>
      </Card>
      )}
    </div>
  )
}

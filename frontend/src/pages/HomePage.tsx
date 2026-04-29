import { useState, useEffect } from 'react'
import { filesApi } from '@api/index'

/**
 * Page d'accueil utilisateur (US01/05/06)
 *
 * Fonctionnalités :
 * - Uploader un fichier (US01/07)
 * - Consulter l'historique des uploads (US05)
 * - Télécharger ses fichiers
 * - Supprimer un fichier (US06)
 *
 * Flux :
 * 1. Au chargement : récupérer la liste des fichiers de l'utilisateur
 * 2. L'utilisateur peut sélectionner un fichier à uploader
 * 3. Après upload : actualiser la liste des fichiers
 * 4. L'utilisateur peut télécharger ou supprimer ses fichiers
 */
export const HomePage = () => {
  /** Liste des fichiers de l'utilisateur (US05) */
  const [files, setFiles] = useState([])

  /** Indicateur de chargement de la liste */
  const [isLoading, setIsLoading] = useState(false)

  /** Message d'erreur à afficher */
  const [error, setError] = useState('')

  /**
   * Charge la liste des fichiers au montage du composant
   */
  useEffect(() => {
    loadFiles()
  }, [])

  /**
   * Récupère la liste des fichiers de l'utilisateur depuis l'API (US05)
   * Endpoint : GET /files
   * Protégé par JWT
   */
  const loadFiles = async () => {
    setIsLoading(true)
    try {
      const response = await filesApi.getAll()
      setFiles(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Gère l'upload d'un fichier (US01/07)
   *
   * Flux :
   * 1. Récupérer le fichier sélectionné
   * 2. Appeler l'API d'upload
   * 3. Actualiser la liste des fichiers
   *
   * Validations côté serveur :
   * - Taille max 1 Go
   * - Extensions interdites : .exe, .bat, .sh, .msi, .cmd, .ps1
   * - Type MIME valide
   *
   * @param e Change event du champ input file
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Uploader le fichier (US01/07)
      await filesApi.upload(file)

      // Actualiser la liste
      await loadFiles()

      // Réinitialiser l'input
      e.target.value = ''
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload')
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accueil</h1>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      )}

      {/* Section Upload (US01/07) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Uploader un fichier</h2>
        <input
          type="file"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {/* Section Historique (US05) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Fichiers ({files.length})</h2>
        {isLoading ? (
          <p className="text-gray-600">Chargement...</p>
        ) : files.length === 0 ? (
          <p className="text-gray-600">Aucun fichier uploadé</p>
        ) : (
          <div className="space-y-2">
            {files.map((file: any) => (
              <div
                key={file.id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                {/* Nom du fichier */}
                <span>{file.name}</span>

                {/* Actions : Télécharger / Supprimer */}
                <div className="space-x-2">
                  {/* Bouton télécharger : récupère depuis son espace privé */}
                  <button
                    onClick={() => filesApi.download(file.id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Télécharger ce fichier"
                  >
                    Télécharger
                  </button>

                  {/* Bouton supprimer (US06) */}
                  <button
                    onClick={async () => {
                      if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
                        try {
                          await filesApi.delete(file.id)
                          await loadFiles()
                        } catch (err: any) {
                          setError(err.response?.data?.message || 'Erreur de suppression')
                        }
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Supprimer ce fichier (irréversible)"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


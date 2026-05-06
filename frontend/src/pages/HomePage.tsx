import { useState, useEffect } from 'react'
import { filesApi } from '@api/index'
import { Card } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Alert, AlertDescription } from '@components/ui/Alert'
import { Loader } from '@components/ui/Loader'
import { Upload, Download, Trash2, FileText, Calendar } from 'lucide-react'

/**
 * Page d'accueil utilisateur (US01/05/06)
 *
 * Fonctionnalités :
 * - Uploader un fichier (US01/07)
 * - Consulter l'historique des uploads (US05)
 * - Télécharger ses fichiers
 * - Supprimer un fichier (US06)
 * - Design harmonisé avec palette orange/crème
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

  /** Indicateur d'upload en cours */
  const [isUploading, setIsUploading] = useState(false)

  /** Message d'erreur à afficher */
  const [error, setError] = useState('')

  /** Message de succès à afficher */
  const [success, setSuccess] = useState('')

  /** Durée d'expiration sélectionnée (1-7 jours, optionnel) */
  const [expirationDays, setExpirationDays] = useState<number | undefined>(7)

  /** Mot de passe optionnel pour protéger le fichier */
  const [filePassword, setFilePassword] = useState('')

  /** Tags optionnels pour organiser le fichier */
  const [fileTags, setFileTags] = useState('')

  /** Affiche le formulaire d'options avancées */
  const [showAdvanced, setShowAdvanced] = useState(false)

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
      setError('')
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
    * 2. Valider les options avancées
    * 3. Appeler l'API d'upload avec paramètres
    * 4. Actualiser la liste des fichiers
    *
    * Options :
    * - expirationDays : 1-7 jours (défaut 7)
    * - filePassword : min 6 caractères (optionnel)
    * - fileTags : tags séparés par des virgules (optionnel)
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

     setIsUploading(true)
     setError('')
     setSuccess('')

      try {
       // Parser les tags séparés par des virgules
       const tags = fileTags
         ? fileTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
         : undefined

       // Valider le mot de passe (min 6 chars si fourni)
       if (filePassword && filePassword.length < 6) {
         setError('Le mot de passe doit faire au moins 6 caractères')
         setIsUploading(false)
         return
       }

       // Uploader le fichier avec les paramètres optionnels (US01/07/09/10)
       await filesApi.upload(
         file,
         expirationDays,
         filePassword || undefined,
         tags
       )

       // Afficher un message de succès
       setSuccess(`Fichier "${file.name}" uploadé avec succès !`)

       // Réinitialiser les champs
       e.target.value = ''
       setFilePassword('')
       setFileTags('')
       setExpirationDays(7)
       setShowAdvanced(false)

       // Actualiser la liste
       await loadFiles()

       // Masquer le message après 3 secondes
       setTimeout(() => setSuccess(''), 3000)
     } catch (err: any) {
       setError(err.response?.data?.message || err.message || 'Erreur lors de l\'upload')
     } finally {
       setIsUploading(false)
     }
   }

  /**
   * Formate une taille en bytes en KB/MB/GB
   * @param bytes Nombre de bytes
   * @returns String formatée avec unité
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Formate une date ISO 8601 en français lisible
   * @param dateString Date ISO 8601
   * @returns String formatée en français
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accueil</h1>
        <p className="text-gray-600">Gérez vos fichiers et partagez-les en toute sécurité</p>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Messages de succès */}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

       {/* Section Upload (US01/07) */}
       <Card className="p-8">
         <div className="flex items-center gap-3 mb-6">
           <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
             <Upload className="h-6 w-6 text-orange-600" />
           </div>
           <h2 className="text-xl font-semibold text-gray-900">Uploader un fichier</h2>
         </div>

         <div className="border-2 border-dashed border-orange-200 rounded-lg p-8 text-center hover:border-orange-300 transition-colors">
           <input
             id="file-upload"
             type="file"
             onChange={handleFileUpload}
             disabled={isUploading}
             className="hidden"
           />
           <label
             htmlFor="file-upload"
             className="cursor-pointer block"
           >
             {isUploading ? (
               <>
                 <Loader size="lg" className="mx-auto mb-3" />
                 <p className="text-gray-600 font-medium">Upload en cours...</p>
               </>
             ) : (
               <>
                 <Upload className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                 <p className="text-gray-900 font-medium mb-1">Déposez votre fichier ici ou cliquez pour sélectionner</p>
                 <p className="text-sm text-gray-500">Taille maximale : 1 Go. Extensions interdites : .exe, .bat, .sh, .msi, .cmd, .ps1</p>
               </>
             )}
           </label>
         </div>

         {/* Options avancées (US09/10) */}
         <div className="mt-6 pt-6 border-t border-gray-200">
           <button
             onClick={() => setShowAdvanced(!showAdvanced)}
             className="text-sm text-orange-600 hover:text-orange-700 font-medium mb-4"
           >
             {showAdvanced ? '▼' : '▶'} Options avancées (optionnel)
           </button>

           {showAdvanced && (
             <div className="space-y-4">
               {/* Expiration du lien (US10) */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Expiration du lien (jours) - Défaut : 7 jours
                 </label>
                 <div className="flex gap-2">
                   {[1, 2, 3, 4, 5, 6, 7].map(days => (
                     <button
                       key={days}
                       onClick={() => setExpirationDays(days)}
                       className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                         expirationDays === days
                           ? 'bg-orange-600 text-white'
                           : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                       }`}
                     >
                       {days}j
                     </button>
                   ))}
                 </div>
               </div>

               {/* Mot de passe optionnel (US09) */}
               <div>
                 <label htmlFor="file-password" className="block text-sm font-medium text-gray-700 mb-2">
                   Mot de passe (optionnel, min 6 caractères)
                 </label>
                 <input
                   id="file-password"
                   type="password"
                   value={filePassword}
                   onChange={e => setFilePassword(e.target.value)}
                   placeholder="Laissez vide pour un fichier public"
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                 />
               </div>

               {/* Tags optionnels (US08) */}
               <div>
                 <label htmlFor="file-tags" className="block text-sm font-medium text-gray-700 mb-2">
                   Tags (optionnel, séparés par des virgules, max 30 chars/tag)
                 </label>
                 <input
                   id="file-tags"
                   type="text"
                   value={fileTags}
                   onChange={e => setFileTags(e.target.value)}
                   placeholder="Ex: projet, confidentiel, 2025-Q1"
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                 />
               </div>
             </div>
           )}
         </div>
       </Card>

      {/* Section Historique (US05) */}
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
            <FileText className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Fichiers uploadés ({files.length})</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Chargement des fichiers...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Aucun fichier uploadé pour le moment</p>
            <p className="text-sm text-gray-500 mt-2">Commencez par uploader votre premier fichier ci-dessus</p>
          </div>
        ) : (
           <div className="space-y-3">
             {files.map((file: any) => (
               <div
                 key={file.id}
                 className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
               >
                 {/* Info du fichier */}
                 <div className="flex-1 mb-4 sm:mb-0">
                   <h3 className="font-medium text-gray-900 mb-1">{file.original_name}</h3>
                   <div className="flex flex-col sm:flex-row gap-3 text-sm text-gray-600">
                     <span className="flex items-center gap-1">
                       <FileText className="h-4 w-4" />
                       {formatFileSize(file.size_bytes)}
                     </span>
                     {file.expires_at && (
                       <span className="flex items-center gap-1">
                         <Calendar className="h-4 w-4" />
                         Expire le {formatDate(file.expires_at)}
                       </span>
                     )}
                     {file.has_password && (
                       <span className="flex items-center gap-1 text-orange-600 font-medium">
                         🔒 Protégé par mot de passe
                       </span>
                     )}
                     {file.tags && file.tags.length > 0 && (
                       <div className="flex gap-1 flex-wrap">
                         {file.tags.map((tag: string) => (
                           <span key={tag} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                             {tag}
                           </span>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Actions */}
                 <div className="flex gap-2 w-full sm:w-auto">
                   {/* Bouton télécharger */}
                   <Button
                     onClick={() => filesApi.download(file.id)}
                     variant="outline"
                     size="sm"
                     title="Télécharger ce fichier"
                     className="flex-1 sm:flex-none"
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Télécharger
                   </Button>

                   {/* Bouton supprimer (US06) */}
                   <Button
                     onClick={async () => {
                       if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.')) {
                         try {
                           await filesApi.delete(file.id)
                           setSuccess('Fichier supprimé avec succès')
                           await loadFiles()
                           setTimeout(() => setSuccess(''), 3000)
                         } catch (err: any) {
                           setError(err.response?.data?.message || 'Erreur de suppression')
                         }
                       }
                     }}
                     variant="outline"
                     size="sm"
                     title="Supprimer ce fichier (irréversible)"
                     className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                   >
                     <Trash2 className="h-4 w-4 mr-2" />
                     Supprimer
                   </Button>
                 </div>
               </div>
             ))}
           </div>
        )}
      </Card>
    </div>
  )
}


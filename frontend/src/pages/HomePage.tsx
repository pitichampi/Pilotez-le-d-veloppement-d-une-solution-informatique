import { useState, useEffect } from 'react'
import { filesApi } from '@api/index'

export const HomePage = () => {
  const [files, setFiles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFiles()
  }, [])

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await filesApi.upload(file)
      await loadFiles()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accueil</h1>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      )}

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

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Fichiers ({files.length})</h2>
        {isLoading ? (
          <p className="text-gray-600">Chargement...</p>
        ) : files.length === 0 ? (
          <p className="text-gray-600">Aucun fichier uploadé</p>
        ) : (
          <div className="space-y-2">
            {files.map((file: any) => (
              <div key={file.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{file.name}</span>
                <button
                  onClick={() => filesApi.download(file.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Télécharger
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


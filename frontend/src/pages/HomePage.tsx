import { useEffect, useState } from 'react'
import { useAuth } from '@hooks/useAuth'
import { filesApi } from '@api/index'
import { Card } from '@components/ui/Card'
import { Alert, AlertDescription } from '@components/ui/Alert'
import { AnonymousUpload } from '@components/AnonymousUpload'
import { Menu, UploadCloud, LogOut, Trash2, FileText, ArrowUpRight, X, Lock } from 'lucide-react'

export const HomePage = () => {
  console.log('HomePage rendu')
  const { logout } = useAuth()
  const [showAnonymousUpload, setShowAnonymousUpload] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openFileMenu, setOpenFileMenu] = useState<string | null>(null)
  const [sharedResult, setSharedResult] = useState<any>(null)
  const [files, setFiles] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired'>('all')

  const filteredFiles = files.filter((file) => {
    if (activeTab === 'all') return true
    const isExpired = new Date(file.expires_at) <= new Date()
    return activeTab === 'expired' ? isExpired : !isExpired
  })

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFileMenu && !(event.target as Element).closest('.file-menu-container')) {
        setOpenFileMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openFileMenu])

  const loadFiles = async () => {
    console.log('loadFiles appelée')
    try {
      const response = await filesApi.getAll()
      console.log('Réponse API:', response.data)
      setFiles(response.data)
      setError('')
    } catch (err: any) {
      console.error('Erreur chargement fichiers:', err)
      setError(err.response?.data?.message || 'Erreur lors du chargement')
    }
  }

  return (
    <div className="flex-1 flex bg-[#FFF8F3] min-h-screen">
      <aside className={`${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-[259px] transform flex flex-col justify-between bg-gradient-to-b from-[#FFB88C] via-[#DE8262] to-[#E27F29] border-r border-white/20 px-6 py-8 transition-transform duration-300 lg:static lg:translate-x-0 lg:w-[259px] lg:border-r lg:border-white/20 lg:py-8 lg:px-6`}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="lg:hidden absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/20 text-white"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center justify-end lg:justify-center">
            <div className="text-3xl font-bold text-white text-right lg:text-center">DataShare</div>
          </div>
          <button
            onClick={() => {
              setShowAnonymousUpload(false)
              setIsMenuOpen(false)
            }}
            className="mt-6 w-full rounded-[12px] bg-white/40 px-4 py-3 text-left text-sm font-semibold text-[#803A00] shadow-sm shadow-black/5"
          >
            Mes fichiers
          </button>
        </div>
        <div className="text-sm text-white/80">Copyright DataShare© 2025</div>
      </aside>

      <main className="relative flex-1">
        <div className={`${isMenuOpen ? 'visible' : 'hidden'} fixed inset-0 z-40 bg-black/30 transition-opacity lg:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)} />
        <div className="mx-auto flex w-full max-w-[1181px] flex-col gap-6">
          <div className="files-topbar flex h-[64px] items-center justify-between gap-3 bg-[#FFEEE3] border-b border-[rgba(216,97,28,0.29)] px-8">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="header-burger flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/80 text-[#1E1E1E] lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 md:ml-auto">
              <button
                onClick={() => {
                  setSharedResult(null)
                  setShowAnonymousUpload(true)
                }}
                className="topbar-action topbar-upload flex h-8 w-[169px] items-center justify-center rounded-[8px] border border-transparent bg-[#2C2C2C] px-3 text-sm font-normal text-[#F3EEEA]"
                type="button"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                <span className="button-label">Téléverser</span>
              </button>
              <button
                onClick={logout}
                className="topbar-action topbar-logout flex h-8 w-[145px] items-center justify-center rounded-[8px] border border-transparent bg-white px-3 text-sm font-normal text-[#E27F29]"
                type="button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="button-label">Déconnexion</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 px-6">
            {!showAnonymousUpload && (
              <>
                <h2 className="text-[28px] font-bold leading-[40px] text-[#000000]">Mes fichiers</h2>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 w-[220px] rounded-[24px] bg-[rgba(255,193,145,0.16)] border border-[rgba(215,99,11,0.2)]">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`flex h-8 w-[67px] items-center justify-center rounded-full text-sm font-medium transition ${
                        activeTab === 'all'
                          ? 'bg-[#E77A6E] text-white'
                          : 'bg-transparent text-[#000000] hover:bg-white/90'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => setActiveTab('active')}
                      className={`flex h-8 w-[75px] items-center justify-center rounded-full text-sm font-medium transition ${
                        activeTab === 'active'
                          ? 'bg-[#E77A6E] text-white'
                          : 'bg-transparent text-[#000000] hover:bg-white/90'
                      }`}
                    >
                      Actifs
                    </button>
                    <button
                      onClick={() => setActiveTab('expired')}
                      className={`flex h-8 w-[78px] items-center justify-center rounded-full text-sm font-medium transition ${
                        activeTab === 'expired'
                          ? 'bg-[#E77A6E] text-white'
                          : 'bg-transparent text-[#000000] hover:bg-white/90'
                      }`}
                    >
                      Expiré
                    </button>
                  </div>
                </div>
              </>
            )}

            {(error || success) && !showAnonymousUpload && (
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert variant="success">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {showAnonymousUpload ? (
              <AnonymousUpload
                onBack={() => {
                  setShowAnonymousUpload(false)
                  setSharedResult(null)
                }}
                shareResult={sharedResult}
              />
            ) : (
              <div className="grid gap-4">
                {filteredFiles.map((file) => {
                  const isExpired = new Date(file.expires_at) <= new Date()
                  return (
                    <Card
                      key={file.id}
                      className="rounded-[8px] border-[rgba(215,99,11,0.2)] bg-[rgba(255,193,145,0.05)] p-4"
                    >
                      <div className="flex h-[56px] items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-white border border-[rgba(215,99,11,0.2)] text-[#1E1E1E]">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="max-w-[140px] md:max-w-none truncate text-base font-semibold text-[#000000]">{file.original_name}</div>
                            <p className={`text-sm ${isExpired ? 'text-[#C62020]' : 'text-[#000000]'}`}>
                              {isExpired
                                ? 'Ce fichier a expiré, il n’est plus stocké chez nous'
                                : `Expire dans ${Math.max(1, Math.ceil((new Date(file.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} jours`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 relative file-menu-container">
                          {file.has_password && (
                            <Lock className="h-5 w-5 text-black" title="Ce fichier est protégé par mot de passe" />
                          )}
                          
                          {/* Bouton mobile seulement - vrai élément HTML */}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Clic détecté sur menu mobile pour fichier:', file.id, 'à', new Date().toISOString())
                              setOpenFileMenu(openFileMenu === file.id ? null : file.id)
                            }}
                            className="md:hidden flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#FFA569] bg-white hover:bg-[#FFF5E8] transition-colors cursor-pointer"
                            type="button"
                            aria-label="Options du fichier"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7.99998 8.66663C8.36817 8.66663 8.66665 8.36815 8.66665 7.99996C8.66665 7.63177 8.36817 7.33329 7.99998 7.33329C7.63179 7.33329 7.33331 7.63177 7.33331 7.99996C7.33331 8.36815 7.63179 8.66663 7.99998 8.66663Z" stroke="#E27F29" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7.99998 3.99996C8.36817 3.99996 8.66665 3.70148 8.66665 3.33329C8.66665 2.9651 8.36817 2.66663 7.99998 2.66663C7.63179 2.66663 7.33331 2.9651 7.33331 3.33329C7.33331 3.70148 7.63179 3.99996 7.99998 3.99996Z" stroke="#E27F29" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7.99998 13.3333C8.36817 13.3333 8.66665 13.0348 8.66665 12.6666C8.66665 12.2984 8.36817 12 7.99998 12C7.63179 12 7.33331 12.2984 7.33331 12.6666C7.33331 13.0348 7.63179 13.3333 7.99998 13.3333Z" stroke="#E27F29" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>

                          {/* Boutons desktop - originaux */}
                          <div className="hidden md:flex items-center gap-2">
                            {!isExpired && (
                              <button
                                onClick={() => {
                                  setSharedResult({
                                    download_url: file.download_url,
                                    originalName: file.original_name,
                                    size: file.size_bytes,
                                    expires_at: file.expires_at,
                                  })
                                  setShowAnonymousUpload(true)
                                }}
                                className="flex h-8 items-center gap-2 rounded-[8px] border border-[#FFA569] bg-white px-4 text-sm font-semibold text-[#E27F29]"
                                type="button"
                              >
                                Accéder <ArrowUpRight className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (confirm('Êtes-vous sûr ? Cette action est irréversible.')) {
                                  try {
                                    await filesApi.delete(file.id)
                                    setSuccess('Fichier supprimé')
                                    await loadFiles()
                                    setTimeout(() => setSuccess(''), 3000)
                                  } catch (err: any) {
                                    setError(err.response?.data?.message || 'Erreur de suppression')
                                  }
                                }
                              }}
                              className="flex h-8 items-center gap-2 rounded-[8px] border border-[#FFA569] bg-white px-4 text-sm font-semibold text-[#E27F29]"
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </button>
                          </div>

                          {/* Menu déroulant mobile */}
                          {openFileMenu === file.id && (
                            <div className="md:hidden absolute right-0 top-full mt-1 z-10 bg-white border border-[#FFA569] rounded-[8px] shadow-lg py-1 min-w-[140px] opacity-100 scale-100 transition-all duration-200">
                              {!isExpired && (
                                <button
                                  onClick={() => {
                                    console.log('Clic sur Accéder mobile pour fichier:', file.id)
                                    setSharedResult({
                                      download_url: file.download_url,
                                      originalName: file.original_name,
                                      size: file.size_bytes,
                                      expires_at: file.expires_at,
                                    })
                                    setShowAnonymousUpload(true)
                                    setOpenFileMenu(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#E27F29] hover:bg-[#FFF8F3] transition-colors"
                                  type="button"
                                >
                                  <ArrowUpRight className="h-4 w-4" />
                                  Accéder
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  console.log('Clic sur Supprimer mobile pour fichier:', file.id)
                                  if (confirm('Êtes-vous sûr ? Cette action est irréversible.')) {
                                    try {
                                      await filesApi.delete(file.id)
                                      setSuccess('Fichier supprimé')
                                      await loadFiles()
                                      setTimeout(() => setSuccess(''), 3000)
                                    } catch (err: any) {
                                      setError(err.response?.data?.message || 'Erreur de suppression')
                                    }
                                  }
                                  setOpenFileMenu(null)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#E27F29] hover:bg-[#FFF8F3] transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


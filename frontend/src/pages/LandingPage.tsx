import { useState } from 'react'
import { GlobalLayout } from '@components/GlobalLayout'
import { AnonymousUpload } from '@components/AnonymousUpload'
import { UploadCloud } from 'lucide-react'

export const LandingPage = () => {
  const [showUpload, setShowUpload] = useState(false)

  if (showUpload) {
    return (
      <GlobalLayout gradient={true} showLoginButton={true}>
        <div className="flex-1 flex items-center justify-center">
          <AnonymousUpload onBack={() => setShowUpload(false)} />
        </div>
      </GlobalLayout>
    )
  }

  return (
    <GlobalLayout gradient={true} showLoginButton={true}>
      <div className="landing-page flex-1 flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-6">
          {/* Title */}
          <h1 className="text-4xl font-light text-center text-black leading-tight max-w-2xl">
            Tu veux partager un fichier ?
          </h1>

          {/* Upload Icon - Clickable */}
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center justify-center rounded-full p-6 hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: "rgba(47, 25, 13, 0.15)" }}
          >
            <div className="flex items-center justify-center rounded-full bg-black p-6 hover:bg-gray-800 transition-colors">
              <UploadCloud className="w-12 h-12 text-white" />
            </div>
          </button>
        </div>
      </div>
    </GlobalLayout>
  )
}

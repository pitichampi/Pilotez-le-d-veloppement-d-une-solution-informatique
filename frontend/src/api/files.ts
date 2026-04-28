import api from './client'

export interface FileMetadata {
  id: string
  uploadToken: string
  originalName: string
  size: number
  mimetype: string
  createdAt: string
  expiresAt: string | null
  isPasswordProtected: boolean
}

export const getFileMetadata = async (token: string): Promise<FileMetadata> => {
  const response = await api.get(`/files/share/${token}/metadata`)
  return response.data
}

export const downloadFile = async (token: string, password?: string) => {
  return api.post(`/files/share/${token}/download`, { password }, {
    responseType: 'blob',
  })
}

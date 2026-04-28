import api from './client'

export interface User {
  id: string
  email: string
  username: string
  createdAt: Date
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<LoginResponse>('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get<User>('/auth/me'),
}

export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  update: (id: string, data: Partial<User>) => api.patch<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
}

export const filesApi = {
  getAll: () => api.get('/files'),
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  delete: (id: string) => api.delete(`/files/${id}`),
  download: (id: string) => api.get(`/files/${id}/download`, {
    responseType: 'blob',
  }),
  getMetadata: (token: string) => api.get(`/files/share/${token}/metadata`),
  downloadPublic: (token: string, password?: string) => api.post(`/files/share/${token}/download`, { password }, {
    responseType: 'blob',
  }),
}

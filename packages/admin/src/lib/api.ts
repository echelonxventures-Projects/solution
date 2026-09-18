import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const api = {
  admin: {
    stats: () => apiClient.get('/admin/stats'),
    bookings: (params?: any) => apiClient.get('/admin/bookings', { params }),
    users: (params?: any) => apiClient.get('/admin/users', { params }),
    userDetail: (id: string) => apiClient.get(`/admin/users/${id}`),
    updateUser: (id: string, data: any) => apiClient.put(`/admin/users/${id}`, data),
    deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
    consultants: (params?: any) => apiClient.get('/admin/consultants', { params }),
    consultantDetail: (id: string) => apiClient.get(`/admin/consultants/${id}`),
    updateConsultant: (id: string, data: any) => apiClient.put(`/admin/consultants/${id}`, data),
    verifications: (params?: any) => apiClient.get('/admin/verifications', { params }),
    approveVerification: (id: string) => apiClient.post(`/admin/verifications/${id}/approve`),
    rejectVerification: (id: string, reason: string) =>
      apiClient.post(`/admin/verifications/${id}/reject`, { reason }),
    payments: (params?: any) => apiClient.get('/admin/payments', { params }),
    refunds: (params?: any) => apiClient.get('/admin/refunds', { params }),
    processRefund: (id: string, data: any) => apiClient.post(`/admin/refunds/${id}`, data),
    content: (params?: any) => apiClient.get('/admin/content', { params }),
    approveContent: (id: string) => apiClient.post(`/admin/content/${id}/approve`),
    rejectContent: (id: string, reason: string) =>
      apiClient.post(`/admin/content/${id}/reject`, { reason }),
    notifications: (params?: any) => apiClient.get('/admin/notifications', { params }),
    sendNotification: (data: any) => apiClient.post('/admin/notifications', data),
    settings: () => apiClient.get('/admin/settings'),
    updateSettings: (data: any) => apiClient.put('/admin/settings', data),
  },
}

export default api
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token')
      await AsyncStorage.removeItem('auth-storage')
    }
    return Promise.reject(error)
  }
)

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    register: (data: any) =>
      apiClient.post('/auth/register', data),
    logout: () =>
      apiClient.post('/auth/logout'),
    refresh: () =>
      apiClient.post('/auth/refresh'),
    me: () =>
      apiClient.get('/auth/me'),
  },

  consultants: {
    list: (params?: any) =>
      apiClient.get('/consultants', { params }),
    get: (id: string) =>
      apiClient.get(`/consultants/${id}`),
    search: (query: string, params?: any) =>
      apiClient.get('/consultants/search', { params: { q: query, ...params } }),
    availability: (id: string, params?: any) =>
      apiClient.get(`/consultants/${id}/availability`, { params }),
    reviews: (id: string, params?: any) =>
      apiClient.get(`/consultants/${id}/reviews`, { params }),
  },

  bookings: {
    list: (params?: any) =>
      apiClient.get('/bookings', { params }),
    get: (id: string) =>
      apiClient.get(`/bookings/${id}`),
    create: (data: any) =>
      apiClient.post('/bookings', data),
    cancel: (id: string, reason?: string) =>
      apiClient.post(`/bookings/${id}/cancel`, { reason }),
  },

  sessions: {
    get: (id: string) =>
      apiClient.get(`/sessions/${id}`),
    join: (id: string) =>
      apiClient.post(`/sessions/${id}/join`),
    end: (id: string) =>
      apiClient.post(`/sessions/${id}/end`),
    sendSignal: (id: string, type: string, data: any) =>
      apiClient.post(`/sessions/${id}/signal`, { type, data }),
  },

  payments: {
    createIntent: (data: any) =>
      apiClient.post('/payments/stripe/intent', data),
    createPayPalOrder: (data: any) =>
      apiClient.post('/payments/paypal/order', data),
  },

  users: {
    profile: () =>
      apiClient.get('/users/me'),
    updateProfile: (data: any) =>
      apiClient.put('/users/me', data),
  },

  notifications: {
    list: () =>
      apiClient.get('/notifications'),
    markRead: (id: string) =>
      apiClient.post(`/notifications/${id}/read`),
  },
}

export default api
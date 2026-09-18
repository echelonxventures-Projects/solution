import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookies
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// API helper functions
export const api = {
  // Auth
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

  
  // Bookings
  bookings: {
    list: (params?: any) =>
      apiClient.get('/bookings', { params }),
    get: (id: string) =>
      apiClient.get(`/bookings/${id}`),
    create: (data: any) =>
      apiClient.post('/bookings', data),
    update: (id: string, data: any) =>
      apiClient.put(`/bookings/${id}`, data),
    cancel: (id: string, reason?: string) =>
      apiClient.post(`/bookings/${id}/cancel`, { reason }),
    confirm: (id: string) =>
      apiClient.post(`/bookings/${id}/confirm`),
  },

  // Sessions
  sessions: {
    list: (params?: any) =>
      apiClient.get('/sessions', { params }),
    get: (id: string) =>
      apiClient.get(`/sessions/${id}`),
    join: (id: string) =>
      apiClient.post(`/sessions/${id}/join`),
    end: (id: string) =>
      apiClient.post(`/sessions/${id}/end`),
    messages: (id: string) =>
      apiClient.get(`/sessions/${id}/messages`),
    sendMessage: (id: string, content: string) =>
      apiClient.post(`/sessions/${id}/messages`, { content }),
  },

  // Payments
  payments: {
    create: (data: any) =>
      apiClient.post('/payments', data),
    get: (id: string) =>
      apiClient.get(`/payments/${id}`),
    confirm: (id: string) =>
      apiClient.post(`/payments/${id}/confirm`),
    createStripePaymentIntent: (data: any) =>
      apiClient.post('/payments/stripe/intent', data),
    createPayPalOrder: (data: any) =>
      apiClient.post('/payments/paypal/order', data),
    capturePayPalOrder: (orderId: string) =>
      apiClient.post(`/payments/paypal/capture/${orderId}`),
  },

  // Reviews
  reviews: {
    create: (data: any) =>
      apiClient.post('/reviews', data),
    list: (params?: any) =>
      apiClient.get('/reviews', { params }),
  },

  // Users
  users: {
    get: (id: string) =>
      apiClient.get(`/users/${id}`),
    update: (id: string, data: any) =>
      apiClient.put(`/users/${id}`, data),
    profile: () =>
      apiClient.get('/users/me'),
    updateProfile: (data: any) =>
      apiClient.put('/users/me', data),
    stats: () =>
      apiClient.get('/users/me/stats'),
  },

  // Consultant-specific endpoints
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
    onboard: (data: any) =>
      apiClient.post('/consultants/onboard', data),
    stats: () =>
      apiClient.get('/consultants/me/stats'),
    bookings: (params?: any) =>
      apiClient.get('/consultants/me/bookings', { params }),
    earnings: (params?: any) =>
      apiClient.get('/consultants/me/earnings', { params }),
    recentReviews: () =>
      apiClient.get('/consultants/me/reviews/recent'),
    getAvailability: () =>
      apiClient.get('/consultants/me/availability'),
    addSlot: (data: any) =>
      apiClient.post('/consultants/me/availability/slots', data),
    removeSlot: (slotId: string) =>
      apiClient.delete(`/consultants/me/availability/slots/${slotId}`),
    generateSlots: (data: any) =>
      apiClient.post('/consultants/me/availability/generate', data),
  },

  // Verticals
  verticals: {
    list: () =>
      apiClient.get('/verticals'),
    get: (id: string) =>
      apiClient.get(`/verticals/${id}`),
  },

  // AI
  ai: {
    match: (query: string, params?: any) =>
      apiClient.post('/ai/matching', { query, ...params }),
    chat: (message: string, context?: any) =>
      apiClient.post('/ai/chatbot', { message, context }),
  },
}

export default api
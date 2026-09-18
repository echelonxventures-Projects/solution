import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface User {
  id: string
  email: string
  name: string
  role: 'seeker' | 'consultant'
  avatar?: string
  firstName?: string
  lastName?: string
  phone?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      setAuth: (user, token) =>
        set({
          isAuthenticated: true,
          user,
          token,
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

// Session store for active video sessions
interface SessionState {
  activeSessionId: string | null
  isConnecting: boolean
  isConnected: boolean
  isMuted: boolean
  isVideoOff: boolean
  localStream: any | null
  remoteStream: any | null
  setActiveSession: (sessionId: string) => void
  clearSession: () => void
  setConnectionStatus: (status: { isConnecting?: boolean; isConnected?: boolean }) => void
  toggleMute: () => void
  toggleVideo: () => void
  setStreams: (local: any, remote: any) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessionId: null,
  isConnecting: false,
  isConnected: false,
  isMuted: false,
  isVideoOff: false,
  localStream: null,
  remoteStream: null,
  setActiveSession: (sessionId) =>
    set({
      activeSessionId: sessionId,
      isConnecting: true,
    }),
  clearSession: () =>
    set({
      activeSessionId: null,
      isConnecting: false,
      isConnected: false,
      localStream: null,
      remoteStream: null,
    }),
  setConnectionStatus: (status) =>
    set((state) => ({
      ...state,
      ...status,
    })),
  toggleMute: () =>
    set((state) => ({
      isMuted: !state.isMuted,
    })),
  toggleVideo: () =>
    set((state) => ({
      isVideoOff: !state.isVideoOff,
    })),
  setStreams: (local, remote) =>
    set({
      localStream: local,
      remoteStream: remote,
    }),
}))

// Search store
interface SearchFilters {
  vertical?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  languages?: string[]
  availability?: 'now' | 'today' | 'week' | 'any'
}

interface SearchState {
  query: string
  filters: SearchFilters
  results: any[]
  isLoading: boolean
  setQuery: (query: string) => void
  setFilters: (filters: SearchFilters) => void
  setResults: (results: any[]) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  filters: {},
  results: [],
  isLoading: false,
  setQuery: (query) => set({ query }),
  setFilters: (filters) => set({ filters }),
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ isLoading: loading }),
  reset: () => set({ query: '', filters: {}, results: [] }),
}))
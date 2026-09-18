import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  role: 'seeker' | 'consultant'
  profileImage?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false
      }),
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)

// Booking store
interface Booking {
  id: string
  consultantId: string
  seekerId: string
  status: string
  scheduledStart: string
  scheduledEnd: string
  consultant?: any
}

interface BookingState {
  bookings: Booking[]
  currentBooking: Booking | null
  isLoading: boolean

  setBookings: (bookings: Booking[]) => void
  addBooking: (booking: Booking) => void
  updateBooking: (id: string, updates: Partial<Booking>) => void
  setCurrentBooking: (booking: Booking | null) => void
  setLoading: (loading: boolean) => void
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  currentBooking: null,
  isLoading: false,

  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) => set((state) => ({
    bookings: [...state.bookings, booking]
  })),
  updateBooking: (id, updates) => set((state) => ({
    bookings: state.bookings.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    ),
  })),
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  setLoading: (loading) => set({ isLoading: loading }),
}))

// Session store for video sessions
interface Participant {
  id: string
  userId: string
  role: string
  isMuted: boolean
  isVideoOff: boolean
}

interface SessionState {
  sessionId: string | null
  roomId: string | null
  participantId: string | null
  participants: Participant[]
  isMuted: boolean
  isVideoOff: boolean
  isConnected: boolean
  isRecording: boolean

  setSession: (sessionId: string, roomId: string) => void
  setParticipantId: (id: string) => void
  addParticipant: (participant: Participant) => void
  removeParticipant: (id: string) => void
  updateParticipant: (id: string, updates: Partial<Participant>) => void
  setMuted: (muted: boolean) => void
  setVideoOff: (off: boolean) => void
  setConnected: (connected: boolean) => void
  setRecording: (recording: boolean) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  roomId: null,
  participantId: null,
  participants: [],
  isMuted: false,
  isVideoOff: false,
  isConnected: false,
  isRecording: false,

  setSession: (sessionId, roomId) => set({ sessionId, roomId }),
  setParticipantId: (id) => set({ participantId: id }),
  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants, participant],
  })),
  removeParticipant: (id) => set((state) => ({
    participants: state.participants.filter((p) => p.id !== id),
  })),
  updateParticipant: (id, updates) => set((state) => ({
    participants: state.participants.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
  })),
  setMuted: (muted) => set({ isMuted: muted }),
  setVideoOff: (off) => set({ isVideoOff: off }),
  setConnected: (connected) => set({ isConnected: connected }),
  setRecording: (recording) => set({ isRecording: recording }),
  clearSession: () => set({
    sessionId: null,
    roomId: null,
    participantId: null,
    participants: [],
    isConnected: false,
  }),
}))

// Search store
interface SearchFilters {
  verticals?: string[]
  priceRange?: { min: number; max: number }
  ratingMin?: number
  availability?: string
  languages?: string[]
}

interface SearchResult {
  id: string
  name: string
  title: string
  rating: number
  hourlyRate: number
  verticals: string[]
  profileImage?: string
}

interface SearchState {
  query: string
  filters: SearchFilters
  results: SearchResult[]
  isSearching: boolean

  setQuery: (query: string) => void
  setFilters: (filters: SearchFilters) => void
  setResults: (results: SearchResult[]) => void
  setSearching: (searching: boolean) => void
  clearSearch: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  filters: {},
  results: [],
  isSearching: false,

  setQuery: (query) => set({ query }),
  setFilters: (filters) => set({ filters }),
  setResults: (results) => set({ results }),
  setSearching: (searching) => set({ isSearching: searching }),
  clearSearch: () => set({ query: '', filters: {}, results: [] }),
}))
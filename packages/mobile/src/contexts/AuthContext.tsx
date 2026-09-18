import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuthStore } from '@stores'
import { api } from '@lib/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthContextType {
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const { setAuth, logout: storeLogout } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token')
      if (token) {
        const response = await api.auth.me()
        setAuth(response.data.user, token)
      }
    } catch (error) {
      await AsyncStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password)
    const { user, token } = response.data
    await AsyncStorage.setItem('auth_token', token)
    setAuth(user, token)
  }

  const register = async (data: any) => {
    const response = await api.auth.register(data)
    const { user, token } = response.data
    await AsyncStorage.setItem('auth_token', token)
    setAuth(user, token)
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch (error) {
      // Ignore logout errors
    }
    await AsyncStorage.removeItem('auth_token')
    storeLogout()
  }

  return (
    <AuthContext.Provider value={{ isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
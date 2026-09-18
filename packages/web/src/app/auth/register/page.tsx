'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<'seeker' | 'consultant'>('seeker')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setApiError('')

    try {
      const nameParts = formData.name.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      await api.auth.register({
        email: formData.email,
        password: formData.password,
        firstName,
        lastName,
        role,
      })

      // Redirect: consultants to onboarding, seekers to login
      if (role === 'consultant') {
        router.push('/consultant/onboarding')
      } else {
        router.push('/auth/login')
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Registration failed. Please try again or make sure the user service is running.'
      setApiError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>C</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#111827' }}>Consultancy</span>
          </a>
          <a href="/auth/login" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: '500' }}>Log in</a>
        </div>
      </div>

      {/* Registration Card */}
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>Create an account</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Join our consultancy platform</p>
          </div>

          {/* Role Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>I want to:</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setRole('seeker')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: role === 'seeker' ? '2px solid #2563eb' : '2px solid #e5e7eb',
                  backgroundColor: role === 'seeker' ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '24px' }}>🔍</span>
                <div>
                  <div style={{ fontWeight: '600', color: role === 'seeker' ? '#2563eb' : '#111827' }}>I'm a Seeker</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Find expert consultants</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole('consultant')}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '12px',
                  border: role === 'consultant' ? '2px solid #2563eb' : '2px solid #e5e7eb',
                  backgroundColor: role === 'consultant' ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '24px' }}>💼</span>
                <div>
                  <div style={{ fontWeight: '600', color: role === 'consultant' ? '#2563eb' : '#111827' }}>I'm a Consultant</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Offer your expertise</div>
                </div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {apiError && (
              <div style={{ marginBottom: '20px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                <p style={{ color: '#dc2626', fontSize: '14px' }}>{apiError}</p>
              </div>
            )}
            {/* Full Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                data-testid="name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: errors.name ? '2px solid #ef4444' : '1px solid #d1d5db',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              {errors.name && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                data-testid="email-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: errors.email ? '2px solid #ef4444' : '1px solid #d1d5db',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              {errors.email && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                data-testid="password-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a strong password (min 8 characters)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: errors.password ? '2px solid #ef4444' : '1px solid #d1d5db',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              {errors.password && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>{errors.password}</p>
              )}
              {/* Password strength indicator */}
              <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    style={{
                      height: '4px',
                      width: '25%',
                      borderRadius: '2px',
                      backgroundColor: formData.password.length >= level * 2
                        ? (level <= 2 ? '#f59e0b' : level === 3 ? '#10b981' : '#059669')
                        : '#e5e7eb',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                data-testid="confirm-password-input"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: errors.confirmPassword ? '2px solid #ef4444' : '1px solid #d1d5db',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              {errors.confirmPassword && (
                <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p style={{ color: '#10b981', fontSize: '14px', marginTop: '4px' }}>✓ Passwords match</p>
              )}
            </div>

            {/* Terms */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <input type="checkbox" style={{ marginTop: '4px' }} />
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                I agree to the <a href="#" style={{ color: '#2563eb' }}>Terms of Service</a> and <a href="#" style={{ color: '#2563eb' }}>Privacy Policy</a>
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'background-color 0.2s',
              }}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ marginTop: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ height: '1px', flex: 1, backgroundColor: '#e5e7eb' }} />
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>or continue with</span>
            <div style={{ height: '1px', flex: 1, backgroundColor: '#e5e7eb' }} />
          </div>

          {/* Social Login */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '20px' }}>🔵</span>
              Google
            </button>
            <button style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '20px' }}>📘</span>
              Facebook
            </button>
          </div>

          {/* Login Link */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280' }}>
              Already have an account?{' '}
              <a href="/auth/login" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
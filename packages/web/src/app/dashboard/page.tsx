'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Demo data for dashboard
const DEMO_STATS = {
  totalSessions: 12,
  totalHours: 24,
  totalSpent: 1800,
  upcomingBookings: 3,
}

const DEMO_UPCOMING = [
  { id: 1, consultant: 'Dr. Sarah Johnson', specialty: 'Business Strategy', date: '2024-01-20', time: '10:00 AM', duration: 60 },
  { id: 2, consultant: 'Michael Chen', specialty: 'Tech Consulting', date: '2024-01-22', time: '2:00 PM', duration: 45 },
  { id: 3, consultant: 'Emma Williams', specialty: 'Financial Planning', date: '2024-01-25', time: '11:00 AM', duration: 30 },
]

const DEMO_PAST = [
  { id: 4, consultant: 'Lisa Thompson', specialty: 'Health Coaching', date: '2024-01-10', amount: 100, rating: 5 },
  { id: 5, consultant: 'James Rodriguez', specialty: 'Career Guidance', date: '2024-01-08', amount: 120, rating: 4 },
  { id: 6, consultant: 'David Park', specialty: 'Legal Advice', date: '2024-01-05', amount: 250, rating: null },
]

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      // Redirect to login if no user
      router.push('/auth/login')
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
        <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '40px', borderRadius: '16px', maxWidth: '400px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            Please log in to view your dashboard
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            You need to be logged in to access this page
          </p>
          <a
            href="/auth/login"
            style={{
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Log In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>C</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#111827' }}>Consultancy</span>
          </a>

          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <a href="/search" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: '500' }}>Find Consultants</a>
            <a href="/dashboard" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>Dashboard</a>
            <button
              onClick={() => {
                localStorage.removeItem('user')
                router.push('/')
              }}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
            Welcome back, {user.name?.split(' ')[0] || 'User'}!
          </h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            Manage your bookings and track your consultation sessions
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Sessions</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{DEMO_STATS.totalSessions}</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Hours Spent</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{DEMO_STATS.totalHours}h</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Spent</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>${DEMO_STATS.totalSpent}</div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Upcoming</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{DEMO_STATS.upcomingBookings}</div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            📅 Upcoming Sessions
          </h2>

          {DEMO_UPCOMING.length > 0 ? (
            <div>
              {DEMO_UPCOMING.map((booking) => (
                <div key={booking.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#dbeafe',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '20px' }}>{booking.consultant.charAt(0)}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{booking.consultant}</div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>{booking.specialty}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{booking.date}</div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>{booking.time} • {booking.duration} min</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: 'none',
                    }}>
                      Join
                    </button>
                    <button style={{
                      backgroundColor: 'white',
                      color: '#6b7280',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: '1px solid #e5e7eb',
                    }}>
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>No upcoming sessions scheduled</p>
              <a href="/search" style={{
                display: 'inline-block',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}>
                Find a Consultant
              </a>
            </div>
          )}
        </div>

        {/* Past Sessions */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>
              📜 Past Sessions
            </h2>
            <a href="/dashboard/history" style={{ color: '#2563eb', fontSize: '14px', textDecoration: 'none' }}>
              View All →
            </a>
          </div>

          {DEMO_PAST.length > 0 ? (
            <div>
              {DEMO_PAST.map((booking) => (
                <div key={booking.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#d1fae5',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>{booking.consultant.charAt(0)}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{booking.consultant}</div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>{booking.specialty} • {booking.date}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontWeight: '600', color: '#111827' }}>${booking.amount}</span>

                    {booking.rating ? (
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} style={{ color: star <= booking.rating ? '#f59e0b' : '#d1d5db', fontSize: '16px' }}>★</span>
                        ))}
                      </div>
                    ) : (
                      <button style={{
                        color: '#2563eb',
                        fontSize: '14px',
                        textDecoration: 'none',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}>
                        Write Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
              No past sessions yet
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <a href="/search" style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '24px',
            borderRadius: '12px',
            textDecoration: 'none',
            display: 'block',
          }}>
            <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>🔍</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Find Consultants</h3>
            <p style={{ fontSize: '14px', color: '#bfdbfe' }}>Browse 8 AI-powered categories</p>
          </a>

          <a href="/category/business" style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '24px',
            borderRadius: '12px',
            textDecoration: 'none',
            display: 'block',
          }}>
            <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>🤖</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>AI Assistant</h3>
            <p style={{ fontSize: '14px', color: '#d1fae5' }}>Get smart recommendations</p>
          </a>

          <a href="/dashboard/wallet" style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            padding: '24px',
            borderRadius: '12px',
            textDecoration: 'none',
            display: 'block',
          }}>
            <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>💰</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Wallet</h3>
            <p style={{ fontSize: '14px', color: '#fef3c7' }}>Manage your balance</p>
          </a>
        </div>
      </main>
    </div>
  )
}
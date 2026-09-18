'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Demo data for consultant dashboard
const DEMO_STATS = {
  monthlyEarnings: 4500,
  earningsGrowth: 18,
  sessionsCompleted: 28,
  avgRating: 4.8,
  responseRate: 95,
}

const DEMO_SCHEDULE = [
  { id: 1, time: '09:00 AM', duration: 60, seeker: 'John Smith', amount: 150, notes: 'Business strategy review' },
  { id: 2, time: '11:30 AM', duration: 45, seeker: 'Emma Wilson', amount: 120, notes: 'Career guidance session' },
  { id: 3, time: '02:00 PM', duration: 30, seeker: 'David Brown', amount: 100, notes: 'Quick consultation' },
]

const DEMO_EARNINGS = {
  weekly: 800,
  monthly: 4500,
  yearly: 38000,
  lifetime: 125000,
}

const DEMO_REVIEWS = [
  { id: 1, rating: 5, date: '2024-01-10', comment: 'Excellent advice, very helpful!' },
  { id: 2, rating: 5, date: '2024-01-08', comment: 'Great session, will book again' },
  { id: 3, rating: 4, date: '2024-01-05', comment: 'Good insights, professional approach' },
]

export default function ConsultantDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsed = JSON.parse(storedUser)
      if (parsed.role === 'consultant') {
        setUser(parsed)
      } else {
        router.push('/consultant/onboarding')
      }
    } else {
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
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💼</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            Consultant Dashboard
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            You need to be registered as a consultant to view this page
          </p>
          <a
            href="/consultant/onboarding"
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
            Become a Consultant
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
            <div style={{ width: '40px', height: '40px', backgroundColor: '#10b981', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>C</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#111827' }}>Consultant Portal</span>
          </a>

          <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a href="/consultant/availability" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: '500' }}>Schedule</a>
            <a href="/consultant/profile" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: '500' }}>Profile</a>
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
        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
              Consultant Dashboard
            </h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>
              Manage your sessions, availability, and earnings
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="/consultant/availability" style={{
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              border: '1px solid #e5e7eb',
            }}>
              Manage Availability
            </a>
            <a href="/consultant/profile" style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
            }}>
              Edit Profile
            </a>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Monthly Earnings</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>${DEMO_STATS.monthlyEarnings}</div>
                <div style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>+{DEMO_STATS.earningsGrowth}% from last month</div>
              </div>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#d1fae5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>💰</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Sessions Completed</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{DEMO_STATS.sessionsCompleted}</div>
              </div>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#dbeafe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>✅</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Average Rating</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{DEMO_STATS.avgRating} ★</div>
              </div>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>⭐</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Response Rate</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{DEMO_STATS.responseRate}%</div>
              </div>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#ede9fe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>💬</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>📅 Today's Schedule</h2>
            <a href="/consultant/schedule" style={{ color: '#10b981', fontSize: '14px', textDecoration: 'none' }}>View Full Schedule →</a>
          </div>

          {DEMO_SCHEDULE.length > 0 ? (
            <div>
              {DEMO_SCHEDULE.map((session) => (
                <div key={session.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'center', width: '80px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{session.time}</div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>{session.duration} min</div>
                    </div>
                    <div style={{ borderLeft: '1px solid #e5e7eb', paddingLeft: '16px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{session.seeker}</div>
                      <div style={{ color: '#6b7280', fontSize: '14px' }}>{session.notes}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontWeight: '600', color: '#111827' }}>${session.amount}</span>
                    <button style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: 'none',
                    }}>
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <p style={{ color: '#6b7280', marginBottom: '16px' }}>No sessions scheduled today</p>
              <a href="/consultant/availability" style={{
                display: 'inline-block',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}>
                Add Availability Slots
              </a>
            </div>
          )}
        </div>

        {/* Earnings & Reviews */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
          {/* Earnings */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>💰 Earnings Overview</h2>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>This Week</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>${DEMO_EARNINGS.weekly}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>This Month</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>${DEMO_EARNINGS.monthly}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>This Year</span>
                <span style={{ fontWeight: '600', color: '#111827' }}>${DEMO_EARNINGS.yearly}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ color: '#6b7280' }}>Lifetime</span>
                <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '18px' }}>${DEMO_EARNINGS.lifetime}</span>
              </div>
            </div>

            <a href="/consultant/earnings" style={{ display: 'block', marginTop: '16px', color: '#10b981', fontSize: '14px', textDecoration: 'none' }}>
              View Detailed Earnings Report →
            </a>
          </div>

          {/* Reviews */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>⭐ Recent Reviews</h2>

            <div>
              {DEMO_REVIEWS.map((review) => (
                <div key={review.id} style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} style={{ color: star <= review.rating ? '#f59e0b' : '#d1d5db', fontSize: '16px' }}>★</span>
                      ))}
                    </div>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>{review.date}</span>
                  </div>
                  <p style={{ color: '#4b5563', fontSize: '14px' }}>{review.comment}</p>
                </div>
              ))}
            </div>

            <a href="/consultant/reviews" style={{ display: 'block', marginTop: '16px', color: '#10b981', fontSize: '14px', textDecoration: 'none' }}>
              View All Reviews →
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>⚡ Quick Actions</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <a href="/consultant/availability" style={{
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              textAlign: 'center',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📅</span>
              <span style={{ color: '#111827', fontWeight: '600' }}>Manage Schedule</span>
            </a>

            <a href="/consultant/content" style={{
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              textAlign: 'center',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📚</span>
              <span style={{ color: '#111827', fontWeight: '600' }}>Upload Content</span>
            </a>

            <a href="/consultant/analytics" style={{
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              textAlign: 'center',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>📊</span>
              <span style={{ color: '#111827', fontWeight: '600' }}>View Analytics</span>
            </a>

            <a href="/consultant/settings" style={{
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              textAlign: 'center',
              textDecoration: 'none',
            }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>⚙️</span>
              <span style={{ color: '#111827', fontWeight: '600' }}>Settings</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
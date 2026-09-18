'use client'

import Link from 'next/link'
import { useState } from 'react'

// Demo consultants data
const DEMO_CONSULTANTS = [
  { id: 'C001', name: 'Dr. Sarah Johnson', email: 'sarah@example.com', specialty: 'Business Strategy', status: 'verified', rating: 4.8, sessions: 45, earnings: 6750, joined: '2024-01-05' },
  { id: 'C002', name: 'Michael Chen', email: 'michael@example.com', specialty: 'Tech Consulting', status: 'pending', rating: null, sessions: 0, earnings: 0, joined: '2024-01-03' },
  { id: 'C003', name: 'Lisa Thompson', email: 'lisa@example.com', specialty: 'Health Coaching', status: 'verified', rating: 4.9, sessions: 62, earnings: 9300, joined: '2023-12-28' },
  { id: 'C004', name: 'Emma Williams', email: 'emma.w@example.com', specialty: 'Financial Planning', status: 'verified', rating: 4.7, sessions: 38, earnings: 5700, joined: '2023-12-20' },
  { id: 'C005', name: 'David Park', email: 'david@example.com', specialty: 'Legal Advice', status: 'verified', rating: 4.9, sessions: 89, earnings: 22250, joined: '2023-12-25' },
  { id: 'C006', name: 'Sophie Turner', email: 'sophie@example.com', specialty: 'Marketing Strategy', status: 'pending', rating: null, sessions: 0, earnings: 0, joined: '2024-01-12' },
  { id: 'C007', name: 'Alex Kim', email: 'alex@example.com', specialty: 'Education Consulting', status: 'verified', rating: 4.6, sessions: 22, earnings: 2200, joined: '2024-01-14' },
  { id: 'C008', name: 'Robert Martinez', email: 'robert@example.com', specialty: 'Career Guidance', status: 'suspended', rating: 3.2, sessions: 15, earnings: 1800, joined: '2023-11-15' },
]

const VERTICALS = [
  'Business Strategy', 'Tech Consulting', 'Health Coaching', 'Financial Planning',
  'Legal Advice', 'Marketing Strategy', 'Education Consulting', 'Career Guidance'
]

const MENU_ITEMS = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Users', href: '/users', icon: '👥' },
  { name: 'Consultants', href: '/consultants', icon: '💼' },
  { name: 'Verifications', href: '/verifications', icon: '✅' },
  { name: 'Bookings', href: '/bookings', icon: '📅' },
  { name: 'Payments', href: '/payments', icon: '💳' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
  { name: 'Billing Config', href: '/billing-config', icon: '💰' },
  { name: 'Scheduling', href: '/billing-scheduling', icon: '⏰' },
]

export default function ConsultantsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSpecialty, setFilterSpecialty] = useState('all')

  const filteredConsultants = DEMO_CONSULTANTS.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus
    const matchesSpecialty = filterSpecialty === 'all' || c.specialty === filterSpecialty
    return matchesSearch && matchesStatus && matchesSpecialty
  })

  const stats = {
    total: DEMO_CONSULTANTS.length,
    verified: DEMO_CONSULTANTS.filter(c => c.status === 'verified').length,
    pending: DEMO_CONSULTANTS.filter(c => c.status === 'pending').length,
    suspended: DEMO_CONSULTANTS.filter(c => c.status === 'suspended').length,
    totalEarnings: DEMO_CONSULTANTS.reduce((sum, c) => sum + c.earnings, 0),
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '80px',
        backgroundColor: '#1f2937',
        color: 'white',
        transition: 'width 0.3s ease',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#2563eb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>C</span>
            </div>
            {sidebarOpen && <span style={{ fontWeight: 'bold', fontSize: '18px' }}>Admin</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '8px',
              backgroundColor: '#374151',
              borderRadius: '6px',
              cursor: 'pointer',
              border: 'none',
              color: 'white',
            }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Menu */}
        <nav style={{ padding: '16px 8px' }}>
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                color: item.name === 'Consultants' ? '#2563eb' : '#d1d5db',
                textDecoration: 'none',
                marginBottom: '4px',
                backgroundColor: item.name === 'Consultants' ? '#374151' : 'transparent',
                transition: 'background-color 0.2s',
              }}
            >
              <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{item.icon}</span>
              {sidebarOpen && <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: sidebarOpen ? '260px' : '80px',
        padding: '32px',
        transition: 'margin-left 0.3s ease',
        width: '100%',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>Consultants Management</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Manage verified consultants on the platform</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Consultants</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.total}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Verified</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.verified}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Pending</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pending}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Suspended</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{stats.suspended}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Earnings</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>${stats.totalEarnings}</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search consultants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                backgroundColor: 'white',
              }}
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                backgroundColor: 'white',
              }}
            >
              <option value="all">All Specialties</option>
              {VERTICALS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Consultants Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {filteredConsultants.map((consultant) => (
            <div
              key={consultant.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: consultant.status === 'verified' ? '#d1fae5' :
                                    consultant.status === 'pending' ? '#fef3c7' : '#fee2e2',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '28px', color: '#111827' }}>
                      {consultant.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '18px', color: '#111827' }}>{consultant.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{consultant.email}</div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      marginTop: '8px',
                      display: 'inline-block',
                    }}>{consultant.specialty}</div>
                  </div>
                </div>

                <span style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: consultant.status === 'verified' ? '#d1fae5' :
                                  consultant.status === 'pending' ? '#fef3c7' : '#fee2e2',
                  color: consultant.status === 'verified' ? '#065f46' :
                         consultant.status === 'pending' ? '#92400e' : '#991b1b',
                }}>
                  {consultant.status}
                </span>
              </div>

              {/* Stats */}
              <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>Rating</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginTop: '4px' }}>
                    {consultant.rating ? `★ ${consultant.rating}` : 'N/A'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>Sessions</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginTop: '4px' }}>
                    {consultant.sessions}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>Earnings</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                    ${consultant.earnings}
                  </div>
                </div>
              </div>

              {/* Joined Date */}
              <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>
                Joined: {consultant.joined}
              </div>

              {/* Actions */}
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <button style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}>View Profile</button>
                {consultant.status === 'verified' && (
                  <button style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>Suspend</button>
                )}
                {consultant.status === 'pending' && (
                  <button style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>Verify</button>
                )}
                {consultant.status === 'suspended' && (
                  <button style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>Reactivate</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
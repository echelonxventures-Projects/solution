'use client'

import Link from 'next/link'
import { useState } from 'react'

// Demo verifications data
const DEMO_VERIFICATIONS = [
  {
    id: 'V001',
    consultant: 'Dr. Sarah Johnson',
    email: 'sarah@example.com',
    specialty: 'Business Strategy',
    documents: ['Resume', 'LinkedIn', 'MBA Certificate'],
    submitted: '2024-01-10',
    status: 'verified',
    experience: '15 years',
    rating: 4.8,
    sessions: 45,
  },
  {
    id: 'V002',
    consultant: 'Michael Chen',
    email: 'michael@example.com',
    specialty: 'Tech Consulting',
    documents: ['Resume', 'LinkedIn', 'AWS Certificate'],
    submitted: '2024-01-08',
    status: 'pending',
    experience: '8 years',
    rating: null,
    sessions: 0,
  },
  {
    id: 'V003',
    consultant: 'Lisa Thompson',
    email: 'lisa@example.com',
    specialty: 'Health Coaching',
    documents: ['Resume', 'LinkedIn', 'Nutrition Certificate', 'Health License'],
    submitted: '2024-01-05',
    status: 'under_review',
    experience: '10 years',
    rating: null,
    sessions: 0,
  },
  {
    id: 'V004',
    consultant: 'James Rodriguez',
    email: 'james@example.com',
    specialty: 'Career Guidance',
    documents: ['Resume', 'LinkedIn'],
    submitted: '2024-01-03',
    status: 'rejected',
    experience: '2 years',
    rating: null,
    sessions: 0,
    reason: 'Insufficient experience - minimum 5 years required',
  },
  {
    id: 'V005',
    consultant: 'Emma Williams',
    email: 'emma.w@example.com',
    specialty: 'Financial Planning',
    documents: ['Resume', 'LinkedIn', 'CPA License', 'Financial Advisor Certificate'],
    submitted: '2023-12-28',
    status: 'verified',
    experience: '12 years',
    rating: 4.7,
    sessions: 38,
  },
  {
    id: 'V006',
    consultant: 'David Park',
    email: 'david@example.com',
    specialty: 'Legal Advice',
    documents: ['Resume', 'LinkedIn', 'Bar License', 'JD Certificate'],
    submitted: '2023-12-25',
    status: 'verified',
    experience: '20 years',
    rating: 4.9,
    sessions: 62,
  },
  {
    id: 'V007',
    consultant: 'Sophie Turner',
    email: 'sophie@example.com',
    specialty: 'Marketing Strategy',
    documents: ['Resume', 'LinkedIn', 'MBA Certificate', 'Google Ads Certificate'],
    submitted: '2024-01-12',
    status: 'pending',
    experience: '6 years',
    rating: null,
    sessions: 0,
  },
  {
    id: 'V008',
    consultant: 'Alex Kim',
    email: 'alex@example.com',
    specialty: 'Education Consulting',
    documents: ['Resume', 'LinkedIn', 'PhD Certificate', 'Teaching License'],
    submitted: '2024-01-14',
    status: 'under_review',
    experience: '7 years',
    rating: null,
    sessions: 0,
  },
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

export default function VerificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedVerification, setSelectedVerification] = useState<any>(null)

  const filteredVerifications = DEMO_VERIFICATIONS.filter(v => {
    const matchesSearch = v.consultant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: DEMO_VERIFICATIONS.length,
    pending: DEMO_VERIFICATIONS.filter(v => v.status === 'pending').length,
    underReview: DEMO_VERIFICATIONS.filter(v => v.status === 'under_review').length,
    verified: DEMO_VERIFICATIONS.filter(v => v.status === 'verified').length,
    rejected: DEMO_VERIFICATIONS.filter(v => v.status === 'rejected').length,
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
                color: item.name === 'Verifications' ? '#2563eb' : '#d1d5db',
                textDecoration: 'none',
                marginBottom: '4px',
                backgroundColor: item.name === 'Verifications' ? '#374151' : 'transparent',
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
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>Consultant Verifications</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Review and approve consultant applications</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Applications</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.total}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Pending</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pending}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Under Review</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>{stats.underReview}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Verified</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.verified}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Rejected</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Verifications List */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredVerifications.map((verification) => (
            <div
              key={verification.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedVerification(verification)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: verification.status === 'verified' ? '#d1fae5' :
                                    verification.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '24px' }}>
                      {verification.status === 'verified' ? '✅' :
                       verification.status === 'rejected' ? '❌' : '⏳'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '18px', color: '#111827' }}>{verification.consultant}</div>
                    <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{verification.email}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                      }}>{verification.specialty}</span>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: '#f3f4f6',
                        color: '#4b5563',
                      }}>{verification.experience}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: verification.status === 'verified' ? '#d1fae5' :
                                    verification.status === 'under_review' ? '#ede9fe' :
                                    verification.status === 'pending' ? '#fef3c7' : '#fee2e2',
                    color: verification.status === 'verified' ? '#065f46' :
                           verification.status === 'under_review' ? '#5b21b6' :
                           verification.status === 'pending' ? '#92400e' : '#991b1b',
                  }}>
                    {verification.status.replace('_', ' ')}
                  </span>
                  <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
                    Submitted: {verification.submitted}
                  </div>
                  {verification.rating && (
                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#111827' }}>
                      ★ {verification.rating} • {verification.sessions} sessions
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Documents submitted:</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {verification.documents.map((doc, i) => (
                    <span key={i} style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      backgroundColor: '#f3f4f6',
                      color: '#4b5563',
                    }}>📄 {doc}</span>
                  ))}
                </div>
              </div>

              {verification.status === 'rejected' && verification.reason && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500' }}>
                    Rejection Reason: {verification.reason}
                  </div>
                </div>
              )}

              {(verification.status === 'pending' || verification.status === 'under_review') && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                  <button style={{
                    padding: '10px 24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}>
                    Approve
                  </button>
                  <button style={{
                    padding: '10px 24px',
                    backgroundColor: 'white',
                    color: '#ef4444',
                    borderRadius: '8px',
                    border: '1px solid #ef4444',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}>
                    Reject
                  </button>
                  <button style={{
                    padding: '10px 24px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>
                    Request More Info
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedVerification && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
            }}
            onClick={() => setSelectedVerification(null)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                  Verification Details
                </h2>
                <button
                  onClick={() => setSelectedVerification(null)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#f3f4f6',
                    cursor: 'pointer',
                    fontSize: '20px',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: '600', fontSize: '20px', color: '#111827' }}>{selectedVerification.consultant}</div>
                <div style={{ color: '#6b7280', marginTop: '4px' }}>{selectedVerification.email}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Specialty</div>
                  <div style={{ fontWeight: '600', color: '#111827', marginTop: '4px' }}>{selectedVerification.specialty}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Experience</div>
                  <div style={{ fontWeight: '600', color: '#111827', marginTop: '4px' }}>{selectedVerification.experience}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Submitted</div>
                  <div style={{ fontWeight: '600', color: '#111827', marginTop: '4px' }}>{selectedVerification.submitted}</div>
                </div>
                <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Status</div>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: selectedVerification.status === 'verified' ? '#d1fae5' :
                                    selectedVerification.status === 'under_review' ? '#ede9fe' :
                                    selectedVerification.status === 'pending' ? '#fef3c7' : '#fee2e2',
                    color: selectedVerification.status === 'verified' ? '#065f46' :
                           selectedVerification.status === 'under_review' ? '#5b21b6' :
                           selectedVerification.status === 'pending' ? '#92400e' : '#991b1b',
                    marginTop: '4px',
                  }}>
                    {selectedVerification.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Documents</div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {selectedVerification.documents.map((doc: string, i: number) => (
                    <div key={i} style={{
                      padding: '12px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}>
                      <span style={{ fontSize: '24px' }}>📄</span>
                      <span style={{ color: '#111827' }}>{doc}</span>
                      <button style={{
                        marginLeft: 'auto',
                        padding: '6px 12px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}>View</button>
                    </div>
                  ))}
                </div>
              </div>

              {selectedVerification.status === 'rejected' && selectedVerification.reason && (
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#991b1b', fontWeight: '600' }}>
                    Rejection Reason
                  </div>
                  <div style={{ marginTop: '8px', color: '#991b1b' }}>{selectedVerification.reason}</div>
                </div>
              )}

              {(selectedVerification.status === 'pending' || selectedVerification.status === 'under_review') && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}>
                    ✅ Approve Verification
                  </button>
                  <button style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}>
                    ❌ Reject Verification
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
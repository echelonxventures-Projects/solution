'use client'

import Link from 'next/link'
import { useState } from 'react'

// Demo bookings data
const DEMO_BOOKINGS = [
  { id: 'B001', consultant: 'Dr. Sarah Johnson', seeker: 'John Smith', vertical: 'Business Strategy', date: '2024-01-15', time: '10:00 AM', duration: 60, amount: 150, status: 'completed', rating: 5 },
  { id: 'B002', consultant: 'Michael Chen', seeker: 'Emma Wilson', vertical: 'Tech Consulting', date: '2024-01-14', time: '2:00 PM', duration: 45, amount: 200, status: 'confirmed', rating: null },
  { id: 'B003', consultant: 'Lisa Thompson', seeker: 'David Brown', vertical: 'Health Coaching', date: '2024-01-13', time: '11:00 AM', duration: 30, amount: 100, status: 'pending', rating: null },
  { id: 'B004', consultant: 'James Rodriguez', seeker: 'Sarah Lee', vertical: 'Career Guidance', date: '2024-01-12', time: '3:00 PM', duration: 60, amount: 120, status: 'completed', rating: 4 },
  { id: 'B005', consultant: 'Emma Williams', seeker: 'Mike Davis', vertical: 'Financial Planning', date: '2024-01-11', time: '9:00 AM', duration: 90, amount: 175, status: 'cancelled', rating: null },
  { id: 'B006', consultant: 'David Park', seeker: 'Anna Martinez', vertical: 'Legal Advice', date: '2024-01-10', time: '4:00 PM', duration: 45, amount: 250, status: 'completed', rating: 5 },
  { id: 'B007', consultant: 'Sophie Turner', seeker: 'Robert Wilson', vertical: 'Marketing Strategy', date: '2024-01-09', time: '1:00 PM', duration: 60, amount: 180, status: 'in_progress', rating: null },
  { id: 'B008', consultant: 'Alex Kim', seeker: 'Jennifer Brown', vertical: 'Education Consulting', date: '2024-01-08', time: '10:30 AM', duration: 30, amount: 80, status: 'completed', rating: 4 },
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

export default function BookingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterVertical, setFilterVertical] = useState('all')

  const verticals = [...new Set(DEMO_BOOKINGS.map(b => b.vertical))]

  const filteredBookings = DEMO_BOOKINGS.filter(booking => {
    const matchesSearch = booking.consultant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.seeker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus
    const matchesVertical = filterVertical === 'all' || booking.vertical === filterVertical
    return matchesSearch && matchesStatus && matchesVertical
  })

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
                color: item.name === 'Bookings' ? '#2563eb' : '#d1d5db',
                textDecoration: 'none',
                marginBottom: '4px',
                backgroundColor: item.name === 'Bookings' ? '#374151' : 'transparent',
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
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>Bookings Management</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Monitor and manage all consultation sessions</p>
          </div>
          <button style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
            Export
          </button>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search bookings..."
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
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterVertical}
              onChange={(e) => setFilterVertical(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                backgroundColor: 'white',
              }}
            >
              <option value="all">All Categories</option>
              {verticals.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Booking ID</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Consultant</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Seeker</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Category</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Date & Time</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Duration</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Rating</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#2563eb', fontWeight: '500' }}>{booking.id}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>{booking.consultant}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>{booking.seeker}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{booking.vertical}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>
                      <div>{booking.date}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{booking.time}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>{booking.duration} min</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>${booking.amount}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: booking.status === 'completed' ? '#d1fae5' :
                                        booking.status === 'confirmed' ? '#dbeafe' :
                                        booking.status === 'in_progress' ? '#ede9fe' :
                                        booking.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: booking.status === 'completed' ? '#065f46' :
                               booking.status === 'confirmed' ? '#1e40af' :
                               booking.status === 'in_progress' ? '#5b21b6' :
                               booking.status === 'pending' ? '#92400e' : '#991b1b',
                      }}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                      {booking.rating ? (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} style={{ color: star <= booking.rating ? '#f59e0b' : '#d1d5db', fontSize: '14px' }}>★</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          backgroundColor: 'white',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}>View</button>
                        {booking.status === 'pending' && (
                          <button style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}>Approve</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats Summary */}
        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Bookings</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{DEMO_BOOKINGS.length}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Completed</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{DEMO_BOOKINGS.filter(b => b.status === 'completed').length}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Pending</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{DEMO_BOOKINGS.filter(b => b.status === 'pending').length}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Revenue</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>${DEMO_BOOKINGS.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.amount, 0)}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Avg. Rating</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
              {DEMO_BOOKINGS.filter(b => b.rating).length > 0
                ? (DEMO_BOOKINGS.filter(b => b.rating).reduce((sum, b) => sum + b.rating!, 0) / DEMO_BOOKINGS.filter(b => b.rating).length).toFixed(1)
                : 'N/A'}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
'use client'

import Link from 'next/link'
import { useState } from 'react'

// Demo payments data
const DEMO_PAYMENTS = [
  { id: 'P001', bookingId: 'B001', consultant: 'Dr. Sarah Johnson', seeker: 'John Smith', amount: 150, platformFee: 22.50, consultantEarnings: 127.50, status: 'completed', date: '2024-01-15', method: 'credit_card' },
  { id: 'P002', bookingId: 'B002', consultant: 'Michael Chen', seeker: 'Emma Wilson', amount: 200, platformFee: 30, consultantEarnings: 170, status: 'pending', date: '2024-01-14', method: 'paypal' },
  { id: 'P003', bookingId: 'B004', consultant: 'James Rodriguez', seeker: 'Sarah Lee', amount: 120, platformFee: 18, consultantEarnings: 102, status: 'completed', date: '2024-01-12', method: 'credit_card' },
  { id: 'P004', bookingId: 'B006', consultant: 'David Park', seeker: 'Anna Martinez', amount: 250, platformFee: 37.50, consultantEarnings: 212.50, status: 'completed', date: '2024-01-10', method: 'bank_transfer' },
  { id: 'P005', bookingId: 'B008', consultant: 'Alex Kim', seeker: 'Jennifer Brown', amount: 80, platformFee: 12, consultantEarnings: 68, status: 'completed', date: '2024-01-08', method: 'credit_card' },
  { id: 'P006', bookingId: 'B003', consultant: 'Lisa Thompson', seeker: 'David Brown', amount: 100, platformFee: 15, consultantEarnings: 85, status: 'refunded', date: '2024-01-13', method: 'credit_card' },
  { id: 'P007', bookingId: 'B007', consultant: 'Sophie Turner', seeker: 'Robert Wilson', amount: 180, platformFee: 27, consultantEarnings: 153, status: 'in_progress', date: '2024-01-09', method: 'wallet' },
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

export default function PaymentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')

  const filteredPayments = DEMO_PAYMENTS.filter(p => {
    const matchesSearch = p.consultant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.seeker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    const matchesMethod = filterMethod === 'all' || p.method === filterMethod
    return matchesSearch && matchesStatus && matchesMethod
  })

  const stats = {
    totalPayments: DEMO_PAYMENTS.length,
    completed: DEMO_PAYMENTS.filter(p => p.status === 'completed').length,
    pending: DEMO_PAYMENTS.filter(p => p.status === 'pending').length,
    refunded: DEMO_PAYMENTS.filter(p => p.status === 'refunded').length,
    totalAmount: DEMO_PAYMENTS.reduce((sum, p) => sum + p.amount, 0),
    totalFees: DEMO_PAYMENTS.reduce((sum, p) => sum + p.platformFee, 0),
    consultantEarnings: DEMO_PAYMENTS.reduce((sum, p) => sum + p.consultantEarnings, 0),
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
                color: item.name === 'Payments' ? '#2563eb' : '#d1d5db',
                textDecoration: 'none',
                marginBottom: '4px',
                backgroundColor: item.name === 'Payments' ? '#374151' : 'transparent',
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
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>Payments Management</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Track all platform transactions and payouts</p>
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
            Export Report
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Transactions</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.totalPayments}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Revenue</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>${stats.totalAmount}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Platform Fees</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>${stats.totalFees}</p>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Consultant Earnings</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>${stats.consultantEarnings}</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search payments..."
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
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                backgroundColor: 'white',
              }}
            >
              <option value="all">All Methods</option>
              <option value="credit_card">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Payment ID</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Booking</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Consultant</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Seeker</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Platform Fee</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Consultant Earns</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#2563eb', fontWeight: '500' }}>{payment.id}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{payment.bookingId}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>{payment.consultant}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>{payment.seeker}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>${payment.amount}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#10b981' }}>${payment.platformFee}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#7c3aed' }}>${payment.consultantEarnings}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: payment.method === 'credit_card' ? '#dbeafe' :
                                        payment.method === 'paypal' ? '#d1fae5' :
                                        payment.method === 'bank_transfer' ? '#fef3c7' : '#ede9fe',
                        color: payment.method === 'credit_card' ? '#1e40af' :
                               payment.method === 'paypal' ? '#065f46' :
                               payment.method === 'bank_transfer' ? '#92400e' : '#5b21b6',
                      }}>
                        {payment.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: payment.status === 'completed' ? '#d1fae5' :
                                        payment.status === 'in_progress' ? '#ede9fe' :
                                        payment.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: payment.status === 'completed' ? '#065f46' :
                               payment.status === 'in_progress' ? '#5b21b6' :
                               payment.status === 'pending' ? '#92400e' : '#991b1b',
                      }}>
                        {payment.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{payment.date}</td>
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
                        {payment.status === 'pending' && (
                          <button style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}>Process</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
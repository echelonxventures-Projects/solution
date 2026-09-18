'use client'

import Link from 'next/link'
import { useState } from 'react'

// Demo data
const DEMO_STATS = {
  totalUsers: 1250,
  activeConsultants: 185,
  totalBookings: 3420,
  totalRevenue: 125000,
  usersGrowth: 12,
  consultantsGrowth: 8,
  bookingsGrowth: 15,
  revenueGrowth: 22,
}

const DEMO_BOOKINGS = [
  { id: 'B001', consultant: 'Dr. Sarah Johnson', seeker: 'John Smith', date: '2024-01-15', amount: 150, status: 'completed' },
  { id: 'B002', consultant: 'Michael Chen', seeker: 'Emma Wilson', date: '2024-01-14', amount: 200, status: 'confirmed' },
  { id: 'B003', consultant: 'Lisa Thompson', seeker: 'David Brown', date: '2024-01-13', amount: 100, status: 'pending' },
  { id: 'B004', consultant: 'James Rodriguez', seeker: 'Sarah Lee', date: '2024-01-12', amount: 120, status: 'completed' },
  { id: 'B005', consultant: 'Emma Williams', seeker: 'Mike Davis', date: '2024-01-11', amount: 175, status: 'cancelled' },
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

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
                color: '#d1d5db',
                textDecoration: 'none',
                marginBottom: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>Dashboard Overview</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>Monitor platform performance and manage operations</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Total Users */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Users</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{DEMO_STATS.totalUsers}</p>
                <p style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>+{DEMO_STATS.usersGrowth}% this month</p>
              </div>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#dbeafe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>👥</span>
              </div>
            </div>
          </div>

          {/* Active Consultants */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Active Consultants</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{DEMO_STATS.activeConsultants}</p>
                <p style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>+{DEMO_STATS.consultantsGrowth}% this month</p>
              </div>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#d1fae5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>💼</span>
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Bookings</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{DEMO_STATS.totalBookings}</p>
                <p style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>+{DEMO_STATS.bookingsGrowth}% this month</p>
              </div>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#ede9fe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>📅</span>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Revenue</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>$125K</p>
                <p style={{ color: '#10b981', fontSize: '14px', marginTop: '8px' }}>+{DEMO_STATS.revenueGrowth}% this month</p>
              </div>
              <div style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px' }}>💰</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', marginBottom: '32px' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Recent Bookings</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Booking ID</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Consultant</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Seeker</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_BOOKINGS.map((booking) => (
                  <tr key={booking.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#2563eb', fontWeight: '500' }}>{booking.id}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>{booking.consultant}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#111827' }}>{booking.seeker}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{booking.date}</td>
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
                                        booking.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: booking.status === 'completed' ? '#065f46' :
                               booking.status === 'confirmed' ? '#1e40af' :
                               booking.status === 'pending' ? '#92400e' : '#991b1b',
                      }}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <Link href="/billing-config" style={{
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '12px',
            padding: '24px',
            textDecoration: 'none',
            display: 'block',
            transition: 'background-color 0.2s',
          }}>
            <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>💰</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Configure Billing</h3>
            <p style={{ fontSize: '14px', color: '#bfdbfe' }}>Set up pricing models, tiers, promotions</p>
          </Link>

          <Link href="/billing-scheduling" style={{
            backgroundColor: '#7c3aed',
            color: 'white',
            borderRadius: '12px',
            padding: '24px',
            textDecoration: 'none',
            display: 'block',
          }}>
            <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>⏰</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Scheduling & Time</h3>
            <p style={{ fontSize: '14px', color: '#ddd6fe' }}>Configure reminders, triggers, expiry rules</p>
          </Link>

          <Link href="/verifications" style={{
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '12px',
            padding: '24px',
            textDecoration: 'none',
            display: 'block',
          }}>
            <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>✅</span>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Pending Verifications</h3>
            <p style={{ fontSize: '14px', color: '#d1fae5' }}>Review consultant applications</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
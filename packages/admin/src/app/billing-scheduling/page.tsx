'use client'

import Link from 'next/link'
import { useState } from 'react'

// Demo schedules data
const DEMO_SCHEDULES = [
  { id: 'S001', name: 'Daily Subscription Check', type: 'daily', startDate: '2024-01-01', endDate: null, expiresAt: '2024-12-31', timezone: 'UTC', status: 'active', nextRun: '2024-01-16 00:00' },
  { id: 'S002', name: 'Weekly Billing Report', type: 'weekly', startDate: '2024-01-01', endDate: null, expiresAt: null, timezone: 'America/New_York', status: 'active', nextRun: '2024-01-22 09:00' },
  { id: 'S003', name: 'Monthly Invoice Generation', type: 'monthly', startDate: '2024-01-01', endDate: null, expiresAt: null, timezone: 'UTC', status: 'active', nextRun: '2024-02-01 00:00' },
  { id: 'S004', name: 'Promotional Campaign', type: 'once', startDate: '2024-02-15', endDate: '2024-02-15', expiresAt: '2024-02-15', timezone: 'UTC', status: 'scheduled', nextRun: '2024-02-15 10:00' },
  { id: 'S005', name: 'Expired Trial Cleanup', type: 'daily', startDate: '2024-01-01', endDate: null, expiresAt: '2024-06-30', timezone: 'UTC', status: 'paused', nextRun: 'Paused' },
]

const DEMO_REMINDERS = [
  { id: 'R001', name: 'Session Reminder - 24h', type: 'session', triggerTime: 24, unit: 'hours_before', channels: ['email', 'sms'], status: 'active' },
  { id: 'R002', name: 'Session Reminder - 1h', type: 'session', triggerTime: 1, unit: 'hours_before', channels: ['push', 'whatsapp'], status: 'active' },
  { id: 'R003', name: 'Payment Due Reminder', type: 'payment', triggerTime: 3, unit: 'days_before', channels: ['email'], status: 'active' },
  { id: 'R004', name: 'Subscription Expiry', type: 'subscription', triggerTime: 7, unit: 'days_before', channels: ['email', 'push'], status: 'active' },
  { id: 'R005', name: 'Follow-up After Session', type: 'session', triggerTime: 48, unit: 'hours_after', channels: ['email'], status: 'active' },
  { id: 'R006', name: 'Inactive User Alert', type: 'user', triggerTime: 30, unit: 'days_inactive', channels: ['email'], status: 'paused' },
]

const DEMO_EXPIRY_RULES = [
  { id: 'E001', name: 'Trial Expiry', target: 'trial_accounts', expiresIn: 14, unit: 'days', action: 'convert_to_paid', gracePeriod: 3, status: 'active' },
  { id: 'E002', name: 'Subscription Expiry', target: 'subscriptions', expiresIn: 30, unit: 'days', action: 'suspend_access', gracePeriod: 7, status: 'active' },
  { id: 'E003', name: 'Promo Code Expiry', target: 'promo_codes', expiresIn: 90, unit: 'days', action: 'deactivate', gracePeriod: 0, status: 'active' },
  { id: 'E004', name: 'Unused Wallet Credits', target: 'wallet_balance', expiresIn: 365, unit: 'days', action: 'expire', gracePeriod: 30, status: 'active' },
  { id: 'E005', name: 'Session Recording Expiry', target: 'recordings', expiresIn: 30, unit: 'days', action: 'delete', gracePeriod: 0, status: 'active' },
  { id: 'E006', name: 'Pending Verification', target: 'verifications', expiresIn: 7, unit: 'days', action: 'auto_reject', gracePeriod: 2, status: 'active' },
]

const DEMO_TRIGGERS = [
  { id: 'T001', name: 'Low Balance Alert', type: 'threshold', condition: 'wallet_balance < 10', action: 'send_notification', status: 'active' },
  { id: 'T002', name: 'Session Complete Trigger', type: 'event', condition: 'session.status = completed', action: 'process_payment', status: 'active' },
  { id: 'T003', name: 'New User Signup', type: 'system_event', condition: 'user.created', action: 'send_welcome_email', status: 'active' },
  { id: 'T004', name: 'Refund Request', type: 'user_action', condition: 'booking.refund_requested', action: 'create_refund_ticket', status: 'active' },
  { id: 'T005', name: 'API Rate Limit', type: 'threshold', condition: 'api_calls > 1000/hour', action: 'throttle_user', status: 'active' },
  { id: 'T006', name: 'Consultant Verified', type: 'system_event', condition: 'consultant.status = verified', action: 'send_verified_email', status: 'active' },
]

const DEMO_AVAILABILITY = [
  { id: 'A001', consultant: 'Dr. Sarah Johnson', timezone: 'America/New_York', workingHours: '09:00-17:00', workingDays: 'Mon-Fri', bufferMinutes: 15, maxBookingsPerDay: 8, status: 'active' },
  { id: 'A002', consultant: 'Michael Chen', timezone: 'America/Los_Angeles', workingHours: '10:00-18:00', workingDays: 'Mon-Sat', bufferMinutes: 10, maxBookingsPerDay: 6, status: 'active' },
  { id: 'A003', consultant: 'Lisa Thompson', timezone: 'Europe/London', workingHours: '08:00-16:00', workingDays: 'Mon-Fri', bufferMinutes: 5, maxBookingsPerDay: 10, status: 'active' },
  { id: 'A004', consultant: 'David Park', timezone: 'Asia/Tokyo', workingHours: '09:00-21:00', workingDays: 'Mon-Sun', bufferMinutes: 0, maxBookingsPerDay: 12, status: 'active' },
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

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo',
  'Asia/Singapore', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland'
]

const SCHEDULE_TYPES = [
  { value: 'once', label: 'One-time Schedule' },
  { value: 'daily', label: 'Daily Schedule' },
  { value: 'weekly', label: 'Weekly Schedule' },
  { value: 'monthly', label: 'Monthly Schedule' },
  { value: 'yearly', label: 'Yearly Schedule' },
  { value: 'cron', label: 'Cron Expression (Advanced)' },
  { value: 'recurring', label: 'Custom Recurring' },
]

const REMINDER_UNITS = [
  { value: 'minutes_before', label: 'Minutes Before' },
  { value: 'hours_before', label: 'Hours Before' },
  { value: 'days_before', label: 'Days Before' },
  { value: 'minutes_after', label: 'Minutes After' },
  { value: 'hours_after', label: 'Hours After' },
  { value: 'days_after', label: 'Days After' },
  { value: 'days_inactive', label: 'Days Inactive' },
]

const EXPIRY_UNITS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
]

const TRIGGER_TYPES = [
  { value: 'threshold', label: 'Threshold (Value crosses limit)' },
  { value: 'event', label: 'Event-based (Run on event)' },
  { value: 'system_event', label: 'System Event (Platform event)' },
  { value: 'user_action', label: 'User Action (User does something)' },
  { value: 'webhook', label: 'Webhook (External trigger)' },
  { value: 'composite', label: 'Composite (Multiple triggers)' },
]

export default function BillingSchedulingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('schedules')
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalType, setModalType] = useState('')

  const tabs = [
    { id: 'schedules', name: 'Billing Schedules', icon: '📅' },
    { id: 'reminders', name: 'Reminders', icon: '🔔' },
    { id: 'expiry', name: 'Expiry Rules', icon: '⚠️' },
    { id: 'triggers', name: 'Trigger Rules', icon: '⚡' },
    { id: 'calendar', name: 'Calendar/Availability', icon: '📆' },
  ]

  const handleAddNew = (type: string) => {
    setModalType(type)
    setShowAddModal(true)
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
                color: item.name === 'Scheduling' ? '#2563eb' : '#d1d5db',
                textDecoration: 'none',
                marginBottom: '4px',
                backgroundColor: item.name === 'Scheduling' ? '#374151' : 'transparent',
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
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>⏰ Time & Scheduling Configuration</h1>
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            Configure all time-based options: schedules, reminders, expiry rules, triggers, and calendar availability.
            Everything is configurable - no hard coding.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 24px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? '#f3f4f6' : 'white',
                  borderBottom: activeTab === tab.id ? '2px solid #2563eb' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  color: activeTab === tab.id ? '#111827' : '#6b7280',
                }}
              >
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Schedules Tab */}
        {activeTab === 'schedules' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Billing Schedules</h2>
              <button
                onClick={() => handleAddNew('schedule')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Add Schedule
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {DEMO_SCHEDULES.map((schedule) => (
                <div key={schedule.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '18px', color: '#111827' }}>{schedule.name}</div>
                      <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
                        Type: <span style={{ color: '#2563eb', fontWeight: '500' }}>{schedule.type}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>Start: {schedule.startDate}</span>
                        {schedule.endDate && <span style={{ fontSize: '14px', color: '#6b7280' }}>End: {schedule.endDate}</span>}
                        {schedule.expiresAt && <span style={{ fontSize: '14px', color: '#ef4444' }}>Expires: {schedule.expiresAt}</span>}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                        Timezone: <span style={{ fontWeight: '500' }}>{schedule.timezone}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: schedule.status === 'active' ? '#d1fae5' :
                                        schedule.status === 'paused' ? '#fef3c7' : '#dbeafe',
                        color: schedule.status === 'active' ? '#065f46' :
                               schedule.status === 'paused' ? '#92400e' : '#1e40af',
                      }}>
                        {schedule.status}
                      </span>
                      <div style={{ fontSize: '14px', color: '#111827', marginTop: '8px' }}>
                        Next Run: {schedule.nextRun}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    <button style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}>Edit</button>
                    {schedule.status === 'active' && (
                      <button style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}>Pause</button>
                    )}
                    {schedule.status === 'paused' && (
                      <button style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}>Resume</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Reminder Configuration</h2>
              <button
                onClick={() => handleAddNew('reminder')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Add Reminder
              </button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Trigger</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Channels</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                      <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_REMINDERS.map((reminder) => (
                      <tr key={reminder.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{reminder.name}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b7280' }}>{reminder.type}</td>
                        <td style={{ padding: '16px 24px', fontSize: '14px', color: '#2563eb' }}>
                          {reminder.triggerTime} {reminder.unit.replace('_', ' ')}
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {reminder.channels.map((ch) => (
                              <span key={ch} style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: '#f3f4f6',
                                color: '#4b5563',
                              }}>{ch}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: reminder.status === 'active' ? '#d1fae5' : '#fef3c7',
                            color: reminder.status === 'active' ? '#065f46' : '#92400e',
                          }}>{reminder.status}</span>
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
                            }}>Edit</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Expiry Rules Tab */}
        {activeTab === 'expiry' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Expiry Rules Configuration</h2>
              <button
                onClick={() => handleAddNew('expiry')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Add Expiry Rule
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {DEMO_EXPIRY_RULES.map((rule) => (
                <div key={rule.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '18px', color: '#111827' }}>{rule.name}</div>
                      <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '8px' }}>
                        Target: <span style={{ fontWeight: '500', color: '#111827' }}>{rule.target}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                        <div style={{ padding: '8px 12px', backgroundColor: '#fee2e2', borderRadius: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#991b1b' }}>Expires in: {rule.expiresIn} {rule.unit}</span>
                        </div>
                        <div style={{ padding: '8px 12px', backgroundColor: '#dbeafe', borderRadius: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#1e40af' }}>Action: {rule.action}</span>
                        </div>
                        {rule.gracePeriod > 0 && (
                          <div style={{ padding: '8px 12px', backgroundColor: '#d1fae5', borderRadius: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#065f46' }}>Grace: {rule.gracePeriod} days</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: rule.status === 'active' ? '#d1fae5' : '#fef3c7',
                      color: rule.status === 'active' ? '#065f46' : '#92400e',
                    }}>{rule.status}</span>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    <button style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}>Edit</button>
                    <button style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}>Disable</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Triggers Tab */}
        {activeTab === 'triggers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Trigger Rules Configuration</h2>
              <button
                onClick={() => handleAddNew('trigger')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Add Trigger
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {DEMO_TRIGGERS.map((trigger) => (
                <div key={trigger.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '18px', color: '#111827' }}>
                        <span style={{ fontSize: '24px', marginRight: '8px' }}>⚡</span>
                        {trigger.name}
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: '#ede9fe',
                          color: '#5b21b6',
                        }}>{trigger.type}</span>
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: trigger.status === 'active' ? '#d1fae5' : '#fef3c7',
                      color: trigger.status === 'active' ? '#065f46' : '#92400e',
                    }}>{trigger.status}</span>
                  </div>
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Condition</div>
                    <div style={{ fontSize: '14px', color: '#111827', fontFamily: 'monospace' }}>{trigger.condition}</div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Action: <span style={{ color: '#10b981', fontWeight: '500' }}>{trigger.action}</span></div>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    <button style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}>Edit</button>
                    <button style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}>Test</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar/Availability Tab */}
        {activeTab === 'calendar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>Consultant Calendar & Availability</h2>
              <button
                onClick={() => handleAddNew('availability')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Configure Availability
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {DEMO_AVAILABILITY.map((avail) => (
                <div key={avail.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '18px', color: '#111827' }}>
                        <span style={{ fontSize: '24px', marginRight: '8px' }}>📆</span>
                        {avail.consultant}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                        Timezone: <span style={{ fontWeight: '500', color: '#111827' }}>{avail.timezone}</span>
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                    }}>{avail.status}</span>
                  </div>

                  <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Working Hours</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginTop: '4px' }}>{avail.workingHours}</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Working Days</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginTop: '4px' }}>{avail.workingDays}</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Buffer Time</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginTop: '4px' }}>{avail.bufferMinutes} min</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Max Bookings/Day</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginTop: '4px' }}>{avail.maxBookingsPerDay}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    <button style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: 'white',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}>Edit</button>
                    <button style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}>View Calendar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
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
            onClick={() => setShowAddModal(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '600px',
                width: '100%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                  New {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
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

              {/* Schedule Form */}
              {modalType === 'schedule' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Schedule Name</label>
                    <input type="text" placeholder="Enter schedule name" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Schedule Type</label>
                    <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                      {SCHEDULE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Start Date & Time</label>
                      <input type="datetime-local" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>End Date & Time (optional)</label>
                      <input type="datetime-local" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Expires At</label>
                      <input type="datetime-local" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Timezone</label>
                      <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Reminder Form */}
              {modalType === 'reminder' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Reminder Name</label>
                    <input type="text" placeholder="Enter reminder name" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Reminder Type</label>
                    <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                      <option value="session">Session Reminder</option>
                      <option value="payment">Payment Reminder</option>
                      <option value="subscription">Subscription Reminder</option>
                      <option value="user">User Activity Reminder</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Trigger Time</label>
                      <input type="number" placeholder="e.g., 24" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Time Unit</label>
                      <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                        {REMINDER_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Notification Channels</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                        <span style={{ color: '#111827' }}>📧 Email</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" style={{ width: '20px', height: '20px' }} />
                        <span style={{ color: '#111827' }}>📱 SMS</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" style={{ width: '20px', height: '20px' }} />
                        <span style={{ color: '#111827' }}>🔔 Push</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" style={{ width: '20px', height: '20px' }} />
                        <span style={{ color: '#111827' }}>💬 WhatsApp</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Expiry Form */}
              {modalType === 'expiry' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Rule Name</label>
                    <input type="text" placeholder="Enter expiry rule name" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Target</label>
                    <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                      <option value="trial_accounts">Trial Accounts</option>
                      <option value="subscriptions">Subscriptions</option>
                      <option value="promo_codes">Promo Codes</option>
                      <option value="wallet_balance">Wallet Balance</option>
                      <option value="recordings">Session Recordings</option>
                      <option value="verifications">Pending Verifications</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Expires In</label>
                      <input type="number" placeholder="e.g., 30" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Time Unit</label>
                      <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                        {EXPIRY_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Action on Expiry</label>
                      <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                        <option value="suspend_access">Suspend Access</option>
                        <option value="convert_to_paid">Convert to Paid</option>
                        <option value="deactivate">Deactivate</option>
                        <option value="expire">Expire</option>
                        <option value="delete">Delete</option>
                        <option value="auto_reject">Auto Reject</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Grace Period (days)</label>
                      <input type="number" placeholder="e.g., 7" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Trigger Form */}
              {modalType === 'trigger' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Trigger Name</label>
                    <input type="text" placeholder="Enter trigger name" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Trigger Type</label>
                    <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                      {TRIGGER_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Condition (Expression)</label>
                    <input type="text" placeholder="e.g., wallet_balance < 10" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', fontFamily: 'monospace' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Action to Execute</label>
                    <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                      <option value="send_notification">Send Notification</option>
                      <option value="process_payment">Process Payment</option>
                      <option value="send_email">Send Email</option>
                      <option value="create_ticket">Create Support Ticket</option>
                      <option value="throttle_user">Throttle User</option>
                      <option value="webhook_call">Call Webhook</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Availability Form */}
              {modalType === 'availability' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Consultant</label>
                    <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                      <option value="all">Select Consultant</option>
                      {DEMO_AVAILABILITY.map((a) => (
                        <option key={a.id} value={a.consultant}>{a.consultant}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Timezone</label>
                    <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}>
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Working Hours Start</label>
                      <input type="time" defaultValue="09:00" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Working Hours End</label>
                      <input type="time" defaultValue="17:00" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Working Days</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked={day !== 'Sat' && day !== 'Sun'} style={{ width: '16px', height: '16px' }} />
                          <span style={{ fontSize: '12px', color: '#111827' }}>{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Buffer Minutes</label>
                      <input type="number" placeholder="e.g., 15" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Max Bookings per Day</label>
                      <input type="number" placeholder="e.g., 8" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Save {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
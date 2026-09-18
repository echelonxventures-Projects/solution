'use client'

import Link from 'next/link'
import { useState } from 'react'

// Demo settings data
const DEMO_SETTINGS = {
  platform: {
    name: 'Consultancy Platform',
    version: '1.0.0',
    supportEmail: 'support@consultancy.com',
    supportPhone: '+1-555-0123',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
    defaultTimezone: 'UTC',
  },
  ai: {
    defaultTier: 'basic',
    standardEndpoint: 'http://localhost:11434',
    openaiKey: 'sk-...',
    anthropicKey: 'sk-ant-...',
    maxTokensPerRequest: 4000,
    enableTranslation: true,
    enableSentiment: true,
    enableMatching: true,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    whatsappEnabled: false,
    reminderHoursBefore: 24,
    followupHoursAfter: 48,
  },
  security: {
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    requireStrongPassword: true,
    enableTwoFactor: false,
    corsOrigins: ['http://localhost:1112', 'http://localhost:1113'],
  },
  billing: {
    platformFeePercent: 15,
    minSessionPrice: 10,
    maxSessionPrice: 1000,
    refundPolicyDays: 7,
    autoCancelUnpaidMinutes: 30,
  },
}

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

const AI_TIERS = [
  { id: 'free', name: 'Free (Standard AI)', description: 'Local AI, limited capabilities' },
  { id: 'basic', name: 'Basic (Enhanced AI)', description: 'Cloud AI, standard features' },
  { id: 'premium', name: 'Premium (Advanced AI)', description: 'Advanced reasoning, better context' },
  { id: 'enterprise', name: 'Enterprise (Enterprise-grade AI)', description: 'Full agentic system, knowledge graph' },
]

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('platform')
  const [settings, setSettings] = useState(DEMO_SETTINGS)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const tabs = [
    { id: 'platform', name: 'Platform', icon: '🌐' },
    { id: 'ai', name: 'AI Settings', icon: '🤖' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'billing', name: 'Billing', icon: '💰' },
  ]

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
                color: item.name === 'Settings' ? '#2563eb' : '#d1d5db',
                textDecoration: 'none',
                marginBottom: '4px',
                backgroundColor: item.name === 'Settings' ? '#374151' : 'transparent',
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
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>Platform Settings</h1>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Configure platform-wide settings and preferences</p>
          </div>
          {saved && (
            <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '12px 24px', borderRadius: '8px', fontWeight: '500' }}>
              ✓ Settings saved successfully!
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
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
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: '24px' }}>
            {/* Platform Settings */}
            {activeTab === 'platform' && (
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Platform Name</label>
                    <input
                      type="text"
                      value={settings.platform.name}
                      onChange={(e) => setSettings({ ...settings, platform: { ...settings.platform, name: e.target.value } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Version</label>
                    <input
                      type="text"
                      value={settings.platform.version}
                      readOnly
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: '#f9fafb' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Support Email</label>
                    <input
                      type="email"
                      value={settings.platform.supportEmail}
                      onChange={(e) => setSettings({ ...settings, platform: { ...settings.platform, supportEmail: e.target.value } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Support Phone</label>
                    <input
                      type="text"
                      value={settings.platform.supportPhone}
                      onChange={(e) => setSettings({ ...settings, platform: { ...settings.platform, supportPhone: e.target.value } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Default Language</label>
                    <select
                      value={settings.platform.defaultLanguage}
                      onChange={(e) => setSettings({ ...settings, platform: { ...settings.platform, defaultLanguage: e.target.value } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Default Currency</label>
                    <select
                      value={settings.platform.defaultCurrency}
                      onChange={(e) => setSettings({ ...settings, platform: { ...settings.platform, defaultCurrency: e.target.value } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Default Timezone</label>
                    <select
                      value={settings.platform.defaultTimezone}
                      onChange={(e) => setSettings({ ...settings, platform: { ...settings.platform, defaultTimezone: e.target.value } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' }}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">EST</option>
                      <option value="America/Los_Angeles">PST</option>
                      <option value="Europe/London">GMT</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.platform.allowRegistration}
                      onChange={(e) => setSettings({ ...settings, platform: { ...settings.platform, allowRegistration: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>Allow New Registrations</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.platform.requireEmailVerification}
                      onChange={(e) => setSettings({ ...settings, platform: { ...settings.platform, requireEmailVerification: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>Require Email Verification</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.platform.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, platform: { ...settings.platform, maintenanceMode: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>Maintenance Mode</span>
                  </label>
                </div>
              </div>
            )}

            {/* AI Settings */}
            {activeTab === 'ai' && (
              <div style={{ display: 'grid', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Default AI Tier</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {AI_TIERS.map((tier) => (
                      <div
                        key={tier.id}
                        onClick={() => setSettings({ ...settings, ai: { ...settings.ai, defaultTier: tier.id } })}
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          border: settings.ai.defaultTier === tier.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                          backgroundColor: settings.ai.defaultTier === tier.id ? '#eff6ff' : 'white',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{tier.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{tier.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Standard AI Endpoint</label>
                    <input
                      type="text"
                      value={settings.ai.standardEndpoint}
                      onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, standardEndpoint: e.target.value } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Max Tokens Per Request</label>
                    <input
                      type="number"
                      value={settings.ai.maxTokensPerRequest}
                      onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, maxTokensPerRequest: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.ai.enableTranslation}
                      onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, enableTranslation: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>Enable Translation</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.ai.enableSentiment}
                      onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, enableSentiment: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>Enable Sentiment Analysis</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.ai.enableMatching}
                      onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, enableMatching: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>Enable AI Matching</span>
                  </label>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailEnabled}
                      onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, emailEnabled: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>📧 Email Notifications</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.smsEnabled}
                      onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, smsEnabled: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>📱 SMS Notifications</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.pushEnabled}
                      onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, pushEnabled: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>🔔 Push Notifications</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.whatsappEnabled}
                      onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, whatsappEnabled: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>💬 WhatsApp Notifications</span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Reminder Before Session (hours)</label>
                    <input
                      type="number"
                      value={settings.notifications.reminderHoursBefore}
                      onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, reminderHoursBefore: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Follow-up After Session (hours)</label>
                    <input
                      type="number"
                      value={settings.notifications.followupHoursAfter}
                      onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, followupHoursAfter: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeoutMinutes}
                      onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTimeoutMinutes: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Max Login Attempts</label>
                    <input
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => setSettings({ ...settings, security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      value={settings.security.lockoutDurationMinutes}
                      onChange={(e) => setSettings({ ...settings, security: { ...settings.security, lockoutDurationMinutes: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.security.requireStrongPassword}
                      onChange={(e) => setSettings({ ...settings, security: { ...settings.security, requireStrongPassword: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>Require Strong Passwords</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.security.enableTwoFactor}
                      onChange={(e) => setSettings({ ...settings, security: { ...settings.security, enableTwoFactor: e.target.checked } })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ color: '#111827' }}>Enable Two-Factor Authentication</span>
                  </label>
                </div>
              </div>
            )}

            {/* Billing Settings */}
            {activeTab === 'billing' && (
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Platform Fee (%)</label>
                    <input
                      type="number"
                      value={settings.billing.platformFeePercent}
                      onChange={(e) => setSettings({ ...settings, billing: { ...settings.billing, platformFeePercent: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Min Session Price ($)</label>
                    <input
                      type="number"
                      value={settings.billing.minSessionPrice}
                      onChange={(e) => setSettings({ ...settings, billing: { ...settings.billing, minSessionPrice: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Max Session Price ($)</label>
                    <input
                      type="number"
                      value={settings.billing.maxSessionPrice}
                      onChange={(e) => setSettings({ ...settings, billing: { ...settings.billing, maxSessionPrice: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Refund Policy (days)</label>
                    <input
                      type="number"
                      value={settings.billing.refundPolicyDays}
                      onChange={(e) => setSettings({ ...settings, billing: { ...settings.billing, refundPolicyDays: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Auto-cancel Unpaid (minutes)</label>
                    <input
                      type="number"
                      value={settings.billing.autoCancelUnpaidMinutes}
                      onChange={(e) => setSettings({ ...settings, billing: { ...settings.billing, autoCancelUnpaidMinutes: parseInt(e.target.value) } })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            style={{
              padding: '12px 32px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Save Settings
          </button>
        </div>
      </main>
    </div>
  )
}
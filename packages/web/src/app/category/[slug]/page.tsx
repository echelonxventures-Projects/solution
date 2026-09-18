'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

// AI Features for each category
const AI_CATEGORY_CONFIG = {
  business: {
    name: 'Business',
    icon: '📊',
    aiFeatures: {
      chatbot: true,
      matching: true,
      knowledgeBase: true,
      sentimentAnalysis: true,
      realTimeSuggestions: true,
      transcription: true,
      translation: true,
    },
    aiModels: {
      free: 'AI Starter',
      basic: 'AI Plus',
      premium: 'AI Pro',
      enterprise: 'AI Enterprise',
    },
    knowledgeDomains: ['Strategy', 'Operations', 'Finance', 'Marketing', 'Management', 'Entrepreneurship'],
    aiCapabilities: [
      'Business plan analysis and recommendations',
      'Market research synthesis',
      'Financial projection modeling',
      'Competitive analysis automation',
      'Strategic decision support',
      'Risk assessment calculations',
    ],
    matchingCriteria: ['Industry experience', 'Company size expertise', 'Geographic focus', 'Specialization'],
    colors: { primary: '#3b82f6', secondary: '#60a5fa' },
  },
  technology: {
    name: 'Technology',
    icon: '💻',
    aiFeatures: {
      chatbot: true,
      matching: true,
      knowledgeBase: true,
      sentimentAnalysis: true,
      realTimeSuggestions: true,
      transcription: true,
      translation: true,
      codeAnalysis: true,
    },
    aiModels: {
      free: 'AI Starter',
      basic: 'AI Plus',
      premium: 'AI Pro',
      enterprise: 'Enterprise-grade AI with Code Analysis',
    },
    knowledgeDomains: ['Software Development', 'AI/ML', 'Cloud Architecture', 'Cybersecurity', 'DevOps', 'Data Science'],
    aiCapabilities: [
      'Code review and optimization suggestions',
      'Architecture pattern recommendations',
      'Technical debt assessment',
      'Technology stack evaluation',
      'Security vulnerability scanning',
      'Performance optimization analysis',
    ],
    matchingCriteria: ['Tech stack expertise', 'Project scale', 'Industry focus', 'Methodology preference'],
    colors: { primary: '#8b5cf6', secondary: '#a78bfa' },
  },
  finance: {
    name: 'Finance',
    icon: '💰',
    aiFeatures: {
      chatbot: true,
      matching: true,
      knowledgeBase: true,
      sentimentAnalysis: true,
      realTimeSuggestions: true,
      transcription: true,
      translation: true,
      riskAnalysis: true,
    },
    aiModels: {
      free: 'AI Starter',
      basic: 'AI Plus',
      premium: 'AI Pro',
      enterprise: 'Enterprise-grade AI with Financial Models',
    },
    knowledgeDomains: ['Investment', 'Taxation', 'Accounting', 'Wealth Management', 'Corporate Finance', 'Personal Finance'],
    aiCapabilities: [
      'Portfolio analysis and recommendations',
      'Tax optimization strategies',
      'Financial health assessment',
      'Investment risk scoring',
      'Budget planning automation',
      'Market trend predictions',
    ],
    matchingCriteria: ['Financial specialty', 'Client type', 'Asset focus', 'Regulatory expertise'],
    colors: { primary: '#10b981', secondary: '#34d399' },
  },
  health: {
    name: 'Health',
    icon: '🏥',
    aiFeatures: {
      chatbot: true,
      matching: true,
      knowledgeBase: true,
      sentimentAnalysis: true,
      realTimeSuggestions: true,
      transcription: true,
      translation: true,
      wellnessTracking: true,
    },
    aiModels: {
      free: 'AI Starter',
      basic: 'AI Plus',
      premium: 'AI Pro',
      enterprise: 'Enterprise-grade AI with Medical Knowledge',
    },
    knowledgeDomains: ['Nutrition', 'Fitness', 'Mental Health', 'Lifestyle', 'Preventive Care', 'Wellness Coaching'],
    aiCapabilities: [
      'Health goal tracking and recommendations',
      'Nutrition plan generation',
      'Fitness routine optimization',
      'Stress pattern analysis',
      'Sleep quality insights',
      'Wellness progress tracking',
    ],
    matchingCriteria: ['Health specialty', 'Approach type', 'Certification level', 'Client demographics'],
    colors: { primary: '#ef4444', secondary: '#f87171' },
  },
  legal: {
    name: 'Legal',
    icon: '⚖️',
    aiFeatures: {
      chatbot: true,
      matching: true,
      knowledgeBase: true,
      sentimentAnalysis: true,
      realTimeSuggestions: true,
      transcription: true,
      translation: true,
      documentAnalysis: true,
    },
    aiModels: {
      free: 'AI Starter',
      basic: 'AI Plus',
      premium: 'AI Pro',
      enterprise: 'Enterprise-grade AI with Legal Database',
    },
    knowledgeDomains: ['Corporate Law', 'Intellectual Property', 'Contract Law', 'Employment Law', 'Real Estate', 'Family Law'],
    aiCapabilities: [
      'Contract clause analysis',
      'Legal precedent research',
      'Risk assessment automation',
      'Document summarization',
      'Compliance checking',
      'Regulatory change monitoring',
    ],
    matchingCriteria: ['Legal specialty', 'Jurisdiction', 'Case type experience', 'Client size'],
    colors: { primary: '#f59e0b', secondary: '#fbbf24' },
  },
  career: {
    name: 'Career',
    icon: '🎯',
    aiFeatures: {
      chatbot: true,
      matching: true,
      knowledgeBase: true,
      sentimentAnalysis: true,
      realTimeSuggestions: true,
      transcription: true,
      translation: true,
      resumeAnalysis: true,
    },
    aiModels: {
      free: 'AI Starter',
      basic: 'AI Plus',
      premium: 'AI Pro',
      enterprise: 'Enterprise-grade AI with Career Models',
    },
    knowledgeDomains: ['Job Search', 'Interview Prep', 'Resume Writing', 'Career Transition', 'Leadership', 'Skill Development'],
    aiCapabilities: [
      'Resume optimization suggestions',
      'Interview question preparation',
      'Career path mapping',
      'Skill gap analysis',
      'Salary negotiation tips',
      'Job market trend analysis',
    ],
    matchingCriteria: ['Industry expertise', 'Career stage focus', 'Geographic market', 'Specialization'],
    colors: { primary: '#ec4899', secondary: '#f472b6' },
  },
  marketing: {
    name: 'Marketing',
    icon: '📣',
    aiFeatures: {
      chatbot: true,
      matching: true,
      knowledgeBase: true,
      sentimentAnalysis: true,
      realTimeSuggestions: true,
      transcription: true,
      translation: true,
      campaignAnalysis: true,
    },
    aiModels: {
      free: 'AI Starter',
      basic: 'AI Plus',
      premium: 'AI Pro',
      enterprise: 'Enterprise-grade AI with Marketing AI',
    },
    knowledgeDomains: ['Digital Marketing', 'Brand Strategy', 'Content Marketing', 'SEO/SEM', 'Social Media', 'Analytics'],
    aiCapabilities: [
      'Campaign performance analysis',
      'Content strategy recommendations',
      'SEO optimization suggestions',
      'Social media trend insights',
      'Audience segmentation',
      'ROI prediction modeling',
    ],
    matchingCriteria: ['Marketing channel expertise', 'Industry focus', 'Budget scale', 'Campaign type'],
    colors: { primary: '#06b6d4', secondary: '#22d3ee' },
  },
  education: {
    name: 'Education',
    icon: '📚',
    aiFeatures: {
      chatbot: true,
      matching: true,
      knowledgeBase: true,
      sentimentAnalysis: true,
      realTimeSuggestions: true,
      transcription: true,
      translation: true,
      learningPathAnalysis: true,
    },
    aiModels: {
      free: 'AI Starter',
      basic: 'AI Plus',
      premium: 'AI Pro',
      enterprise: 'Enterprise-grade AI with Education Models',
    },
    knowledgeDomains: ['Academic Tutoring', 'Test Preparation', 'Language Learning', 'Professional Development', 'Study Skills', 'Curriculum Design'],
    aiCapabilities: [
      'Learning style assessment',
      'Study plan generation',
      'Progress tracking insights',
      'Knowledge gap identification',
      'Curriculum recommendations',
      'Performance prediction',
    ],
    matchingCriteria: ['Subject expertise', 'Education level', 'Teaching style', 'Language proficiency'],
    colors: { primary: '#84cc16', secondary: '#a3e635' },
  },
}

// AI Chat messages type
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// AI Matched Consultant
interface AIConsultantMatch {
  id: number
  name: string
  title: string
  rating: number
  hourlyRate: number
  matchScore: number
  matchReasons: string[]
  availability: string
  aiInsights: string[]
}

export default function AICategoryPage() {
  const params = useParams()
  const categorySlug = params?.slug as string || 'business'
  const config = AI_CATEGORY_CONFIG[categorySlug as keyof typeof AI_CATEGORY_CONFIG] || AI_CATEGORY_CONFIG.business

  const [activeTab, setActiveTab] = useState<'chat' | 'match' | 'knowledge' | 'insights'>('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Welcome to the ${config.name} AI Assistant! I can help you:\n\n• Find the right consultant for your needs\n• Answer questions about ${config.name} topics\n• Provide insights from our knowledge base\n• Guide you through the booking process\n\nWhat would you like help with today?`,
      timestamp: new Date(),
    },
  ])
  const [userInput, setUserInput] = useState('')
  const [isAILoading, setIsAILoading] = useState(false)
  const [matchedConsultants, setMatchedConsultants] = useState<AIConsultantMatch[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [aiTier, setAiTier] = useState<'free' | 'basic' | 'premium' | 'enterprise'>('premium')

  // Simulated AI Chat Response
  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    }
    setChatMessages(prev => [...prev, userMessage])
    setUserInput('')
    setIsAILoading(true)

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Generate AI response based on context
    const aiResponse = generateAIResponse(userInput, config, matchedConsultants)

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    }
    setChatMessages(prev => [...prev, assistantMessage])
    setIsAILoading(false)
  }

  // AI Matching
  const handleAIMatching = async () => {
    if (!searchQuery.trim()) return
    setIsAILoading(true)

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulated AI matching results
    const matches = generateAIMatches(searchQuery, config)
    setMatchedConsultants(matches)
    setIsAILoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: config.colors.primary, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>C</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#111827' }}>Consultancy</span>
          </a>

          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
              🤖 AI Online
            </span>
            <a href="/search" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: '500' }}>Find Consultants</a>
            <a href="/auth/login" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: '500' }}>Log in</a>
            <a href="/auth/register" style={{ backgroundColor: config.colors.primary, color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>Sign up</a>
          </nav>
        </div>
      </header>

      {/* Category Hero with AI Badge */}
      <section style={{ backgroundColor: config.colors.primary, color: 'white', padding: '60px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <span style={{ fontSize: '64px' }}>{config.icon}</span>
            <div>
              <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>{config.name} Consultancy</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ backgroundColor: '#1d4ed8', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                  🤖 AI-Powered
                </span>
                <span style={{ backgroundColor: '#1d4ed8', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                  🧠 Smart Matching
                </span>
                <span style={{ backgroundColor: '#1d4ed8', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                  💬 24/7 AI Assistant
                </span>
              </div>
            </div>
          </div>

          {/* AI Model Selector */}
          <div style={{ marginTop: '24px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>Select AI Tier for Enhanced Features:</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {Object.entries(config.aiModels).map(([tier, model]) => (
                <button
                  key={tier}
                  onClick={() => setAiTier(tier as any)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px',
                    backgroundColor: aiTier === tier ? 'white' : 'transparent',
                    color: aiTier === tier ? config.colors.primary : 'white',
                    border: aiTier === tier ? 'none' : '1px solid white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  <div style={{ fontSize: '12px', fontWeight: '400', marginTop: '4px' }}>{model}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Dashboard */}
      <section style={{ padding: '32px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* AI Features Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {Object.entries(config.aiFeatures).filter(([, enabled]) => enabled).map(([feature]) => (
              <div key={feature} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <span style={{ fontSize: '24px' }}>
                  {feature === 'chatbot' ? '💬' :
                   feature === 'matching' ? '🎯' :
                   feature === 'knowledgeBase' ? '📚' :
                   feature === 'sentimentAnalysis' ? '😊' :
                   feature === 'realTimeSuggestions' ? '💡' :
                   feature === 'transcription' ? '📝' :
                   feature === 'translation' ? '🌐' :
                   feature === 'codeAnalysis' ? '💻' :
                   feature === 'riskAnalysis' ? '⚠️' :
                   feature === 'documentAnalysis' ? '📄' :
                   feature === 'resumeAnalysis' ? '📋' :
                   feature === 'campaignAnalysis' ? '📈' :
                   feature === 'learningPathAnalysis' ? '🎓' : '✨'}
                </span>
                <div style={{ fontWeight: '600', marginTop: '8px', color: '#111827' }}>
                  {feature.split(/(?=[A-Z])/).join(' ').replace(/^./, str => str.toUpperCase())}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {(['chat', 'match', 'knowledge', 'insights'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: activeTab === tab ? config.colors.primary : 'white',
                  color: activeTab === tab ? 'white' : '#4b5563',
                  border: activeTab === tab ? 'none' : '1px solid #e5e7eb',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {tab === 'chat' ? '💬 AI Chat' :
                 tab === 'match' ? '🎯 AI Matching' :
                 tab === 'knowledge' ? '📚 Knowledge Base' :
                 '💡 AI Insights'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {/* AI Chat Tab */}
            {activeTab === 'chat' && (
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontSize: '14px', color: '#6b7280' }}>
                  <strong style={{ color: '#111827' }}>AI Model:</strong> {config.aiModels[aiTier]} |
                  <strong style={{ color: '#111827', marginLeft: '16px' }}>Category:</strong> {config.name} |
                  <strong style={{ color: '#111827', marginLeft: '16px' }}>Features:</strong> Real-time suggestions, Knowledge retrieval, Intent detection
                </div>

                {/* Chat Messages */}
                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: msg.role === 'assistant' ? config.colors.primary : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: msg.role === 'assistant' ? 'white' : '#4b5563',
                        fontWeight: 'bold',
                      }}>
                        {msg.role === 'assistant' ? '🤖' : '👤'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          backgroundColor: msg.role === 'assistant' ? 'white' : config.colors.secondary,
                          padding: '12px 16px',
                          borderRadius: '12px',
                          color: '#111827',
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isAILoading && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: config.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🤖
                      </div>
                      <div style={{ backgroundColor: 'white', padding: '12px 16px', borderRadius: '12px' }}>
                        <span style={{ animation: 'pulse 1s infinite' }}>Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={`Ask about ${config.name} consultancy, consultants, or any questions...`}
                    style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '16px' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isAILoading}
                    style={{
                      backgroundColor: config.colors.primary,
                      color: 'white',
                      padding: '16px 32px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      cursor: isAILoading ? 'not-allowed' : 'pointer',
                      opacity: isAILoading ? 0.7 : 1,
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* AI Matching Tab */}
            {activeTab === 'match' && (
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>AI-Powered Consultant Matching</h3>
                  <p style={{ color: '#6b7280' }}>Our AI analyzes your needs and matches you with the best consultants using semantic search, preference learning, and real-time scoring.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Describe your ${config.name} needs (e.g., "I need help with startup strategy and funding")`}
                    style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '16px' }}
                  />
                  <button
                    onClick={handleAIMatching}
                    disabled={isAILoading}
                    style={{
                      backgroundColor: config.colors.primary,
                      color: 'white',
                      padding: '16px 32px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      cursor: isAILoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isAILoading ? 'AI Searching...' : '🤖 AI Match'}
                  </button>
                </div>

                {/* Matching Criteria */}
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '12px' }}>AI Matching Criteria:</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {config.matchingCriteria.map((criterion) => (
                      <span key={criterion} style={{ backgroundColor: config.colors.secondary, color: 'white', padding: '8px 12px', borderRadius: '20px', fontSize: '14px' }}>
                        {criterion}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Matched Consultants */}
                {matchedConsultants.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: '600', marginBottom: '16px' }}>AI-Matched Consultants ({matchedConsultants.length})</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      {matchedConsultants.map((consultant) => (
                        <div key={consultant.id} style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '2px solid ' + config.colors.primary }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{consultant.name}</div>
                              <div style={{ color: '#6b7280' }}>{consultant.title}</div>
                            </div>
                            <div style={{ backgroundColor: config.colors.primary, color: 'white', padding: '8px 16px', borderRadius: '20px', fontWeight: '600' }}>
                              {consultant.matchScore}% Match
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span>{'★'.repeat(Math.floor(consultant.rating))}</span>
                            <span style={{ color: '#6b7280' }}>{consultant.rating}</span>
                            <span style={{ color: '#6b7280', marginLeft: '16px' }}>${consultant.hourlyRate}/hour</span>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '8px', color: config.colors.primary }}>🤖 AI Match Reasons:</div>
                            {consultant.matchReasons.map((reason, i) => (
                              <div key={i} style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>• {reason}</div>
                            ))}
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: '600', marginBottom: '8px', color: config.colors.primary }}>💡 AI Insights:</div>
                            {consultant.aiInsights.map((insight, i) => (
                              <div key={i} style={{ fontSize: '14px', color: '#4b5563', marginBottom: '4px' }}>• {insight}</div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#10b981', fontWeight: '600' }}>📅 {consultant.availability}</span>
                            <a
                              href={`/consultant/${consultant.id}`}
                              style={{
                                backgroundColor: config.colors.primary,
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: '600',
                                display: 'inline-block',
                              }}
                            >
                              Book Session
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Knowledge Base Tab */}
            {activeTab === 'knowledge' && (
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>AI Knowledge Base</h3>
                  <p style={{ color: '#6b7280' }}>RAG-powered knowledge retrieval from {config.name} domain expertise.</p>
                </div>

                {/* Knowledge Domains */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {config.knowledgeDomains.map((domain) => (
                    <div key={domain} style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: config.colors.primary }}>{domain}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        AI-powered content generation, case studies, best practices, and expert insights.
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Vector Indexed</span>
                        <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Graph Linked</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Capabilities */}
                <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '16px', color: config.colors.primary }}>🤖 AI Capabilities for {config.name}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {config.aiCapabilities.map((capability) => (
                      <div key={capability} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ backgroundColor: config.colors.secondary, color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                        <span style={{ color: '#111827' }}>{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights Tab */}
            {activeTab === 'insights' && (
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>AI-Generated Insights</h3>
                  <p style={{ color: '#6b7280' }}>Real-time analytics, predictions, and recommendations powered by {config.aiModels[aiTier]}</p>
                </div>

                {/* AI Analysis Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ backgroundColor: '#dbeafe', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>87%</div>
                    <div style={{ color: '#3b82f6' }}>Match Accuracy</div>
                  </div>
                  <div style={{ backgroundColor: '#d1fae5', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#065f46' }}>4.8</div>
                    <div style={{ color: '#10b981' }}>Avg Satisfaction</div>
                  </div>
                  <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400e' }}>2.3s</div>
                    <div style={{ color: '#f59e0b' }}>Avg Response</div>
                  </div>
                  <div style={{ backgroundColor: '#fce7f3', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9f1239' }}>1.2K</div>
                    <div style={{ color: '#ec4899' }}>Sessions Today</div>
                  </div>
                </div>

                {/* Sentiment Analysis */}
                <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '16px' }}>😊 Real-time Sentiment Analysis</h4>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '8px', color: '#6b7280' }}>Current Session Mood Distribution</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '60%', height: '24px', backgroundColor: '#10b981', borderRadius: '4px' }} title="Positive: 60%" />
                        <div style={{ width: '30%', height: '24px', backgroundColor: '#f59e0b', borderRadius: '4px' }} title="Neutral: 30%" />
                        <div style={{ width: '10%', height: '24px', backgroundColor: '#ef4444', borderRadius: '4px' }} title="Negative: 10%" />
                      </div>
                      <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                        <span>Positive: 60%</span>
                        <span>Neutral: 30%</span>
                        <span>Negative: 10%</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '8px', color: '#6b7280' }}>Emotional Categories Detected</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ backgroundColor: '#d1fae5', padding: '8px 12px', borderRadius: '20px', fontSize: '14px' }}>😊 Satisfaction 42%</span>
                        <span style={{ backgroundColor: '#dbeafe', padding: '8px 12px', borderRadius: '20px', fontSize: '14px' }}>🎯 Engaged 35%</span>
                        <span style={{ backgroundColor: '#fef3c7', padding: '8px 12px', borderRadius: '20px', fontSize: '14px' }}>🤔 Curious 18%</span>
                        <span style={{ backgroundColor: '#fce7f3', padding: '8px 12px', borderRadius: '20px', fontSize: '14px' }}>🙏 Grateful 5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Predictive Analytics */}
                <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '16px' }}>📊 AI Predictions for {config.name}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: config.colors.primary }}>Demand Forecast</div>
                      <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        Next 7 days: <span style={{ fontWeight: '600', color: '#10b981' }}>↑ 15% increase</span> expected based on historical patterns and market trends.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: config.colors.primary }}>Top Consultant Picks</div>
                      <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        AI recommends: Dr. Sarah Johnson, Michael Chen based on upcoming query patterns.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: config.colors.primary }}>Optimal Booking Time</div>
                      <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        Best availability: <span style={{ fontWeight: '600' }}>Tomorrow 10:00 AM - 2:00 PM</span> with highest-rated consultants.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#111827', color: '#9ca3af', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontWeight: 'bold', color: 'white' }}>{config.name} Consultancy</span> - AI-Powered by {config.aiModels[aiTier]}
          </div>
          <div style={{ fontSize: '14px' }}>
            © 2024 Consultancy Platform - AI-Powered Consultancy Marketplace.
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper function to generate AI responses
function generateAIResponse(input: string, config: any, matches: AIConsultantMatch[]): string {
  const lowerInput = input.toLowerCase()

  if (lowerInput.includes('find') || lowerInput.includes('consultant') || lowerInput.includes('need help')) {
    return `Based on your request about "${input}", I can help you find the perfect ${config.name} consultant!\n\n🔍 Using AI Semantic Search:\n• Analyzing your intent and needs\n• Matching with ${config.knowledgeDomains.length} knowledge domains\n• Scoring consultants by ${config.matchingCriteria.join(', ')}\n\n💡 Recommendation:\nGo to the "AI Matching" tab to get personalized consultant recommendations with match scores and AI insights.\n\nWould you like me to explain any specific aspect of ${config.name} consultancy?`
  }

  if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('rate')) {
    return `Great question about pricing! Here's what our AI found:\n\n💰 Pricing Analysis for ${config.name}:\n• Average hourly rate: $120-$200\n• Premium consultants: $200-$300/hour\n• Session packages available\n\n💡 AI Recommendation:\nBased on your needs, I'd suggest looking at consultants with rates between $150-$200 for optimal value. Our matching algorithm factors in price-performance ratio.\n\nWant to see specific consultants with their rates?`
  }

  if (lowerInput.includes('book') || lowerInput.includes('schedule') || lowerInput.includes('appointment')) {
    return `I can help you schedule a ${config.name} consultation!\n\n📅 AI Scheduling Assistant:\n• Checking consultant availability in real-time\n• Finding optimal time slots based on preferences\n• Coordinating across time zones\n\n⚡ Quick Action:\n1. Use "AI Matching" to find your consultant\n2. Click "Book Session" on their profile\n3. Choose your preferred time slot\n\nOur AI will send reminders and prepare session materials automatically!`
  }

  if (matches.length > 0 && (lowerInput.includes('match') || lowerInput.includes('recommend'))) {
    const topMatch = matches[0]
    return `Based on our AI matching analysis:\n\n🎯 Top Recommendation: ${topMatch.name}\n• Match Score: ${topMatch.matchScore}%\n• Expertise: ${topMatch.title}\n• Rate: $${topMatch.hourlyRate}/hour\n\n🤖 AI Match Reasons:\n${topMatch.matchReasons.map(r => `• ${r}`).join('\n')}\n\n💡 AI Insights:\n${topMatch.aiInsights.map(i => `• ${i}`).join('\n')}\n\nWould you like to book a session or see more options?`
  }

  // Default knowledgeable response
  return `Thank you for your question about "${input}"!\n\n📚 AI Knowledge Retrieval:\nFrom our ${config.name} knowledge base covering ${config.knowledgeDomains.join(', ')}, here are some relevant insights:\n\n${config.aiCapabilities.slice(0, 3).map((c: string) => `• ${c}`).join('\n')}\n\n🤖 I'm using ${config.aiModels.premium} to provide personalized assistance. Ask me anything about consultants, booking, pricing, or ${config.name} topics!\n\nQuick tip: Use the tabs above for AI Matching, Knowledge Base, and Insights!`
}

// Helper function to generate AI matches
function generateAIMatches(query: string, config: any): AIConsultantMatch[] {
  const consultants = [
    { id: 1, name: `Dr. Sarah Johnson`, title: `${config.name} Strategy Expert`, rating: 4.9, hourlyRate: 180 },
    { id: 2, name: `Michael Chen`, title: `${config.name} Consultant`, rating: 4.8, hourlyRate: 150 },
    { id: 3, name: `Emma Williams`, title: `${config.name} Advisor`, rating: 4.7, hourlyRate: 130 },
  ]

  return consultants.map(c => ({
    ...c,
    matchScore: 85 + Math.floor(Math.random() * 15),
    matchReasons: [
      `Strong expertise in ${config.knowledgeDomains[Math.floor(Math.random() * config.knowledgeDomains.length)]}`,
      `High success rate with similar client needs`,
      `Excellent ratings in ${config.name} consultations`,
    ],
    availability: 'Available tomorrow',
    aiInsights: [
      `AI predicts high engagement based on query analysis`,
      `Knowledge graph suggests relevant domain overlap`,
      `Sentiment analysis indicates strong consultation potential`,
    ],
  }))
}
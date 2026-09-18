'use client'

import { useState, useEffect } from 'react'

// AI Configuration based on subscription tier
const AI_CONFIG = {
  free: {
    model: 'Standard AI',
    features: ['Basic Chat', 'Simple Matching'],
    responseDelay: 3000,
  },
  basic: {
    model: 'Enhanced AI',
    features: ['Chat', 'Matching', 'Knowledge'],
    responseDelay: 2000,
  },
  premium: {
    model: 'Advanced AI',
    features: ['Chat', 'Matching', 'Knowledge', 'Insights', 'Sentiment'],
    responseDelay: 1500,
  },
  enterprise: {
    model: 'Enterprise-grade AI',
    features: ['All Features', 'Custom Fine-tuned', 'Real-time Copilot'],
    responseDelay: 1000,
  },
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you:\n\n• Find the right consultant\n• Answer questions about any category\n• Book sessions\n• Get AI-powered recommendations\n\nWhat would you like help with?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [aiTier, setAiTier] = useState<'free' | 'basic' | 'premium' | 'enterprise'>('premium')

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response based on tier
    const delay = AI_CONFIG[aiTier].responseDelay
    await new Promise(resolve => setTimeout(resolve, delay))

    const aiResponse = generateResponse(input, aiTier)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, assistantMessage])
    setIsLoading(false)
  }

  // Generate contextual AI response
  const generateResponse = (query: string, tier: string): string => {
    const lowerQuery = query.toLowerCase()
    const config = AI_CONFIG[tier as keyof typeof AI_CONFIG] || AI_CONFIG.basic

    if (lowerQuery.includes('business')) {
      return `📊 Business Consultancy:\n\nOur AI has identified ${config.features.includes('Matching') ? '15 highly matched' : '5 available'} consultants in Business Strategy.\n\n${config.features.includes('Insights') ? '💡 AI Insights: Based on market trends, strategy consultants are seeing 23% higher demand this quarter.' : ''}\n\nWould you like me to show you the best matches?`
    }

    if (lowerQuery.includes('technology') || lowerQuery.includes('tech')) {
      return `💻 Technology Consultancy:\n\n${config.features.includes('Knowledge') ? 'AI Knowledge Retrieval: Found experts in Software Development, AI/ML, Cloud Architecture, and Cybersecurity.' : 'We have technology consultants available.'}\n\n${config.features.includes('Matching') ? '🎯 AI Match Score: Top consultants have 92-95% match rates for tech queries.' : ''}\n\nGo to /category/technology for full AI features!`
    }

    if (lowerQuery.includes('finance') || lowerQuery.includes('money') || lowerQuery.includes('investment')) {
      return `💰 Finance Consultancy:\n\n${config.features.includes('Sentiment') ? '😊 Sentiment Analysis: Your query indicates interest in investment guidance. AI detected "curious" and "interested" emotions.' : ''}\n\nOur finance experts cover: Investment, Taxation, Wealth Management, and Corporate Finance.\n\n${config.features.includes('Insights') ? '📊 AI Prediction: 15% increase in finance consultation demand expected next week.' : ''}`
    }

    if (lowerQuery.includes('book') || lowerQuery.includes('schedule') || lowerQuery.includes('appointment')) {
      return `📅 AI Scheduling Assistant:\n\n${config.features.includes('Matching') ? '🔍 Using semantic search to find available consultants...' : 'Checking availability...'}\n\n✅ Best available slots:\n• Tomorrow 10:00 AM - 2:00 PM\n• Wednesday 3:00 PM - 5:00 PM\n\n${config.features.includes('Insights') ? '💡 AI Recommendation: Morning slots have 18% higher satisfaction rates based on historical data.' : ''}\n\nWhich time works for you?`
    }

    if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('rate')) {
      return `💰 Pricing Information:\n\nAverage rates by category:\n• Business: $150-$200/hr\n• Technology: $150-$250/hr\n• Finance: $175-$250/hr\n• Health: $100-$150/hr\n• Legal: $200-$300/hr\n\n${config.features.includes('Insights') ? '📊 AI Analysis: Consultants with AI Match scores above 90% typically deliver 23% better outcomes, making them worth the premium rates.' : ''}\n\nWant to see specific consultant rates?`
    }

    if (lowerQuery.includes('help') || lowerQuery.includes('what can')) {
      return `🤖 AI Capabilities (${config.model}):\n\n${config.features.map(f => `• ${f}`).join('\n')}\n\nI can assist you with:\n1. Finding consultants in 8 AI-powered categories\n2. Understanding pricing and availability\n3. Booking and scheduling\n4. Getting insights and recommendations\n5. Knowledge retrieval from our database\n\nJust ask me anything!`
    }

    // Default intelligent response
    return `Thank you for your question!\n\n${config.features.includes('Knowledge') ? `📚 AI Knowledge Retrieval: Processing your query across our knowledge base using ${config.model}...` : ''}\n\nBased on your input "${query}", I can help you:\n\n• Find relevant consultants\n• Explore category-specific AI features\n• Book a consultation session\n\n${config.features.includes('Sentiment') ? '😊 Sentiment detected: Interested, engaged' : ''}\n\nWhat would you like to do next?`
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
          backgroundColor: '#2563eb',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)',
          cursor: 'pointer',
          zIndex: 1000,
          border: 'none',
        }}
      >
        <span style={{ fontSize: 32, color: 'white' }}>🤖</span>
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 400,
        height: 500,
        backgroundColor: 'white',
        borderRadius: 16,
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid #2563eb',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>🤖 AI Assistant</div>
          <div style={{ fontSize: 12, color: '#bfdbfe' }}>{AI_CONFIG[aiTier].model}</div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: 24,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* AI Tier Selector */}
      <div style={{ padding: 8, backgroundColor: '#f3f4f6', display: 'flex', gap: 8 }}>
        {Object.keys(AI_CONFIG).map((tier) => (
          <button
            key={tier}
            onClick={() => setAiTier(tier as any)}
            style={{
              padding: 6,
              borderRadius: 8,
              backgroundColor: aiTier === tier ? '#2563eb' : 'white',
              color: aiTier === tier ? 'white' : '#4b5563',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: aiTier === tier ? 'none' : '1px solid #e5e7eb',
            }}
          >
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
          backgroundColor: '#f9fafb',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: 12,
              display: 'flex',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: msg.role === 'assistant' ? '#2563eb' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: msg.role === 'assistant' ? 'white' : '#dbeafe',
                padding: 12,
                borderRadius: 12,
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🤖
            </div>
            <div style={{ backgroundColor: 'white', padding: 12, borderRadius: 12 }}>
              <span style={{ color: '#6b7280' }}>Processing with {AI_CONFIG[aiTier].model}...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: 16, display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 14,
          }}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: 12,
            borderRadius: 8,
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
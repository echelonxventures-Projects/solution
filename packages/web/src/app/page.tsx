export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>C</span>
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '20px', color: '#111827' }}>Consultancy</span>
          </a>

          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <a href="/search" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: '500' }}>Find Consultants</a>
            <a href="/auth/login" style={{ color: '#4b5563', textDecoration: 'none', fontWeight: '500' }}>Log in</a>
            <a href="/auth/register" style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>Sign up</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ backgroundColor: '#2563eb', color: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.2' }}>
            Connect with Expert Consultants Worldwide
          </h1>
          <p style={{ fontSize: '20px', marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px', color: '#bfdbfe' }}>
            AI-powered matching, real-time insights, and verified experts across any domain. Get personalized advice through video sessions.
          </p>

          {/* AI Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
            <span style={{ backgroundColor: '#1d4ed8', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>🤖 AI-Powered Matching</span>
            <span style={{ backgroundColor: '#1d4ed8', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>💬 24/7 AI Chatbot</span>
            <span style={{ backgroundColor: '#1d4ed8', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>📊 Real-time Insights</span>
          </div>

          {/* Search Box */}
          <div style={{ maxWidth: '600px', margin: '0 auto 40px', display: 'flex', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden' }}>
            <input
              type="text"
              placeholder="What expertise are you looking for?"
              style={{ flex: 1, padding: '16px 24px', border: 'none', fontSize: '16px', outline: 'none' }}
            />
            <button style={{ backgroundColor: '#2563eb', color: 'white', padding: '16px 32px', fontWeight: '600', cursor: 'pointer' }}>
              🔍 AI Search
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', maxWidth: '800px', margin: '40px auto 0' }}>
            <div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>10,000+</div>
              <div style={{ color: '#bfdbfe' }}>Consultants</div>
            </div>
            <div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>8+</div>
              <div style={{ color: '#bfdbfe' }}>AI Categories</div>
            </div>
            <div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>87%</div>
              <div style={{ color: '#bfdbfe' }}>Match Accuracy</div>
            </div>
            <div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>24/7</div>
              <div style={{ color: '#bfdbfe' }}>AI Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Powered Categories Section */}
      <section style={{ padding: '64px 24px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>Explore AI-Powered Categories</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px' }}>
            Each category features intelligent matching, AI chatbot, knowledge base, and real-time insights
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { emoji: '📊', name: 'Business', slug: 'business', color: '#3b82f6', ai: 'Strategy, Operations, Finance AI' },
              { emoji: '💻', name: 'Technology', slug: 'technology', color: '#8b5cf6', ai: 'Code Analysis, Architecture AI' },
              { emoji: '💰', name: 'Finance', slug: 'finance', color: '#10b981', ai: 'Risk Analysis, Portfolio AI' },
              { emoji: '🏥', name: 'Health', slug: 'health', color: '#ef4444', ai: 'Wellness, Nutrition AI' },
              { emoji: '⚖️', name: 'Legal', slug: 'legal', color: '#f59e0b', ai: 'Document, Compliance AI' },
              { emoji: '🎯', name: 'Career', slug: 'career', color: '#ec4899', ai: 'Resume, Interview AI' },
              { emoji: '📣', name: 'Marketing', slug: 'marketing', color: '#06b6d4', ai: 'Campaign, SEO AI' },
              { emoji: '📚', name: 'Education', slug: 'education', color: '#84cc16', ai: 'Learning Path AI' },
            ].map((cat) => (
              <a key={cat.slug} href={`/category/${cat.slug}`} style={{
                display: 'block',
                backgroundColor: '#f9fafb',
                padding: '24px',
                borderRadius: '12px',
                textAlign: 'center',
                textDecoration: 'none',
                border: `2px solid ${cat.color}`,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: cat.color,
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '600',
                }}>
                  AI
                </div>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>{cat.emoji}</span>
                <span style={{ fontWeight: '700', color: '#111827', fontSize: '18px', display: 'block' }}>{cat.name}</span>
                <span style={{ fontSize: '12px', color: cat.color, marginTop: '8px', display: 'block' }}>{cat.ai}</span>
                <div style={{ marginTop: '12px', display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Chat</span>
                  <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Match</span>
                  <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Insights</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Consultants with AI Insights */}
      <section style={{ padding: '64px 24px', backgroundColor: '#f3f4f6' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>Featured Consultants</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '32px' }}>
            AI-recommended based on ratings, expertise match, and availability
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { name: 'Dr. Sarah Johnson', title: 'Business Strategy', rating: 4.9, price: 150, category: 'business', match: 94 },
              { name: 'Michael Chen', title: 'Tech & AI Consultant', rating: 4.8, price: 200, category: 'technology', match: 92 },
              { name: 'Emma Williams', title: 'Financial Advisor', rating: 4.7, price: 175, category: 'finance', match: 91 },
              { name: 'James Rodriguez', title: 'Career Coach', rating: 4.9, price: 120, category: 'career', match: 95 },
              { name: 'Lisa Thompson', title: 'Health & Wellness', rating: 4.6, price: 100, category: 'health', match: 88 },
              { name: 'David Park', title: 'Legal Consultant', rating: 4.8, price: 250, category: 'legal', match: 93 },
            ].map((c) => (
              <a key={c.name} href={`/category/${c.category}`} style={{
                display: 'block',
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '12px',
                textDecoration: 'none',
                border: '1px solid #e5e7eb',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '20px' }}>{c.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{c.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>{c.title}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  {'★'.repeat(Math.floor(c.rating))}
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>{c.rating}</span>
                </div>
                <div style={{ fontWeight: '600', color: '#111827', marginBottom: '8px' }}>${c.price}/hour</div>
                <div style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                  🤖 AI Match: {c.match}%
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works with AI */}
      <section style={{ padding: '64px 24px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>How AI-Powered Consultation Works</h2>
          <p style={{ color: '#6b7280', marginBottom: '48px' }}>Get expert consultation with intelligent assistance</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[
              { step: 1, icon: '🤖', title: 'AI Finds Your Expert', desc: 'Semantic search matches your needs to consultants' },
              { step: 2, icon: '📅', title: 'AI Schedules Session', desc: 'Smart scheduling finds optimal time slots' },
              { step: 3, icon: '💡', title: 'AI Copilot Assists', desc: 'Real-time suggestions during consultation' },
              { step: 4, icon: '📊', title: 'AI Analyzes Results', desc: 'Insights and follow-up recommendations' },
            ].map((s) => (
              <div key={s.step} style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '2px solid #2563eb' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>{s.step}</span>
                </div>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{s.icon}</span>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#111827' }}>{s.title}</div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Overview */}
      <section style={{ padding: '64px 24px', backgroundColor: '#2563eb', color: 'white' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>Complete AI Features</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[
              { icon: '💬', title: 'AI Chatbot', desc: '24/7 intelligent assistance' },
              { icon: '🎯', title: 'Smart Matching', desc: 'Semantic consultant search' },
              { icon: '📚', title: 'Knowledge Base', desc: 'RAG-powered retrieval' },
              { icon: '😊', title: 'Sentiment Analysis', desc: 'Emotion detection' },
              { icon: '💡', title: 'Real-time Suggestions', desc: 'Live copilot assistance' },
              { icon: '📝', title: 'Transcription', desc: 'Whisper-powered audio' },
              { icon: '🌐', title: 'Translation', desc: 'Multi-language support' },
              { icon: '📊', title: 'Analytics', desc: 'Predictive insights' },
            ].map((f) => (
              <div key={f.title} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '24px', borderRadius: '12px' }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>{f.icon}</span>
                <div style={{ fontWeight: '600', marginBottom: '8px' }}>{f.title}</div>
                <div style={{ color: '#bfdbfe', fontSize: '14px' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#111827', color: '#9ca3af', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>C</span>
                </div>
                <span style={{ fontWeight: 'bold', color: 'white' }}>Consultancy</span>
              </div>
              <p style={{ fontSize: '14px' }}>AI-powered platform connecting you with verified expert consultants worldwide.</p>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', color: 'white', marginBottom: '16px' }}>AI Categories</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <a href="/category/business" style={{ color: '#9ca3af', textDecoration: 'none' }}>📊 Business</a>
                <a href="/category/technology" style={{ color: '#9ca3af', textDecoration: 'none' }}>💻 Technology</a>
                <a href="/category/finance" style={{ color: '#9ca3af', textDecoration: 'none' }}>💰 Finance</a>
                <a href="/category/health" style={{ color: '#9ca3af', textDecoration: 'none' }}>🏥 Health</a>
              </div>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', color: 'white', marginBottom: '16px' }}>More Categories</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <a href="/category/legal" style={{ color: '#9ca3af', textDecoration: 'none' }}>⚖️ Legal</a>
                <a href="/category/career" style={{ color: '#9ca3af', textDecoration: 'none' }}>🎯 Career</a>
                <a href="/category/marketing" style={{ color: '#9ca3af', textDecoration: 'none' }}>📣 Marketing</a>
                <a href="/category/education" style={{ color: '#9ca3af', textDecoration: 'none' }}>📚 Education</a>
              </div>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', color: 'white', marginBottom: '16px' }}>Support</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>💬 AI Help Chat</a>
                <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Help Center</a>
                <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Contact Us</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #374151', marginTop: '32px', paddingTop: '32px', textAlign: 'center', fontSize: '14px' }}>
            © 2024 Consultancy Platform. Powered by Claude, GPT, and custom AI models.
          </div>
        </div>
      </footer>
    </div>
  )
}
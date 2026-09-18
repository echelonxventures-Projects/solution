'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function Hero() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Connect with Expert<br />
            Consultants Worldwide
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Find verified experts across any domain. Get personalized advice through real-time video sessions.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="flex bg-white rounded-xl shadow-lg overflow-hidden">
              <input
                type="text"
                placeholder="What expertise are you looking for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-6 py-4 text-gray-900 outline-none"
              />
              <button
                type="submit"
                className="bg-blue-600 px-8 py-4 font-semibold hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="text-blue-200">Popular:</span>
            {['Business Strategy', 'Tech Consulting', 'Financial Advice', 'Career Coaching'].map((topic) => (
              <Link
                key={topic}
                href={`/search?q=${encodeURIComponent(topic)}`}
                className="bg-blue-800/50 px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                {topic}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-bold">10,000+</div>
            <div className="text-blue-200">Expert Consultants</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold">50+</div>
            <div className="text-blue-200">Categories</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold">4.9</div>
            <div className="text-blue-200">Average Rating</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold">24/7</div>
            <div className="text-blue-200">Availability</div>
          </div>
        </div>
      </div>
    </section>
  )
}
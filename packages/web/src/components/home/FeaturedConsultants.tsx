'use client'

import Link from 'next/link'

// Static placeholder data for demo
const DEMO_CONSULTANTS = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    title: 'Business Strategy Consultant',
    rating: 4.9,
    reviewCount: 128,
    hourlyRate: 150,
    verticals: ['Business', 'Strategy'],
    verified: true,
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'Tech & AI Consultant',
    rating: 4.8,
    reviewCount: 95,
    hourlyRate: 200,
    verticals: ['Technology', 'AI'],
    verified: true,
  },
  {
    id: '3',
    name: 'Emma Williams',
    title: 'Financial Advisor',
    rating: 4.7,
    reviewCount: 82,
    hourlyRate: 175,
    verticals: ['Finance', 'Investment'],
    verified: true,
  },
  {
    id: '4',
    name: 'James Rodriguez',
    title: 'Career Coach',
    rating: 4.9,
    reviewCount: 156,
    hourlyRate: 120,
    verticals: ['Career', 'Coaching'],
    verified: true,
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    title: 'Health & Wellness Expert',
    rating: 4.6,
    reviewCount: 67,
    hourlyRate: 100,
    verticals: ['Health', 'Wellness'],
    verified: true,
  },
  {
    id: '6',
    name: 'David Park',
    title: 'Legal Consultant',
    rating: 4.8,
    reviewCount: 43,
    hourlyRate: 250,
    verticals: ['Legal', 'Business'],
    verified: true,
  },
]

export function FeaturedConsultants() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Featured Consultants</h2>
        <Link
          href="/search"
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View all
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEMO_CONSULTANTS.map((consultant) => (
          <Link
            key={consultant.id}
            href={`/consultant/${consultant.id}`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all group"
          >
            {/* Avatar */}
            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center ring-2 ring-blue-200">
                <span className="text-blue-600 font-bold text-xl">
                  {consultant.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {consultant.name}
                </h3>
                <p className="text-sm text-gray-500">{consultant.title}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="mt-4 flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(consultant.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {consultant.rating.toFixed(1)} ({consultant.reviewCount} reviews)
              </span>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {consultant.verticals.map((vertical) => (
                <span key={vertical} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  {vertical}
                </span>
              ))}
            </div>

            {/* Price */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-gray-600 font-medium">
                ${consultant.hourlyRate}/hour
              </span>
              {consultant.verified && (
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
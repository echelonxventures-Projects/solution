'use client'

import Link from 'next/link'

const VERTICALS = [
  { id: '1', name: 'Business', icon: '📊', consultantCount: 150 },
  { id: '2', name: 'Technology', icon: '💻', consultantCount: 200 },
  { id: '3', name: 'Finance', icon: '💰', consultantCount: 85 },
  { id: '4', name: 'Health', icon: '🏥', consultantCount: 120 },
  { id: '5', name: 'Legal', icon: '⚖️', consultantCount: 45 },
  { id: '6', name: 'Career', icon: '🎯', consultantCount: 95 },
  { id: '7', name: 'Marketing', icon: '📣', consultantCount: 75 },
  { id: '8', name: 'Education', icon: '📚', consultantCount: 60 },
]

export function PopularVerticals() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Explore Categories
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {VERTICALS.map((vertical) => (
          <Link
            key={vertical.id}
            href={`/search?vertical=${encodeURIComponent(vertical.name)}`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all text-center group"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
              <span className="text-3xl">
                {vertical.icon}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {vertical.name}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {vertical.consultantCount} consultants
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
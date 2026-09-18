'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Consultant {
  id: string
  name: string
  title: string
  bio?: string
  rating: number
  reviewCount: number
  hourlyRate: number
  currency: string
  verticals: string[]
  skills: string[]
  profileImage?: string
  verified: boolean
  available: boolean
}

interface SearchResultsProps {
  results: Consultant[]
  total: number
}

export function SearchResults({ results, total }: SearchResultsProps) {
  const router = useRouter()

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-secondary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-lg font-medium text-secondary-900 mb-2">No results found</h3>
        <p className="text-secondary-600">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-secondary-600">
          Found {total} consultants
        </p>
        <select className="input w-auto">
          <option value="rating">Sort by Rating</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="reviews">Most Reviews</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((consultant) => (
          <Link
            key={consultant.id}
            href={`/consultant/${consultant.id}`}
            className="card hover:shadow-md transition-shadow group"
          >
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                {consultant.profileImage ? (
                  <img
                    src={consultant.profileImage}
                    alt={consultant.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary-600 font-semibold text-xl">
                    {consultant.name?.charAt(0) || 'C'}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600">
                    {consultant.name}
                  </h3>
                  {consultant.verified && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-secondary-600">{consultant.title}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(consultant.rating) ? 'text-yellow-400' : 'text-secondary-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-secondary-600">
                {consultant.rating.toFixed(1)} ({consultant.reviewCount} reviews)
              </span>
            </div>

            {/* Verticals */}
            <div className="mt-3 flex flex-wrap gap-2">
              {consultant.verticals.slice(0, 3).map((vertical) => (
                <span key={vertical} className="badge badge-primary">
                  {vertical}
                </span>
              ))}
            </div>

            {/* Skills */}
            <div className="mt-3">
              <p className="text-sm text-secondary-500">
                {consultant.skills.slice(0, 5).join(', ')}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="font-semibold text-secondary-900">
                  ${consultant.hourlyRate}
                </span>
                <span className="text-secondary-600 text-sm">/hour</span>
              </div>

              <span className={`badge ${consultant.available ? 'badge-success' : 'badge-warning'}`}>
                {consultant.available ? 'Available' : 'Busy'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
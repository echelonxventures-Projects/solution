'use client'

import { useRouter } from 'next/navigation'
import { useSearchStore } from '@/stores'

interface SearchFiltersProps {
  onApply: () => void
}

export function SearchFilters({ onApply }: SearchFiltersProps) {
  const router = useRouter()
  const { filters, setFilters } = useSearchStore()

  const verticals = [
    'Business Strategy',
    'Technology',
    'Finance',
    'Healthcare',
    'Legal',
    'Career',
    'Marketing',
    'Education',
  ]

  const handleVerticalSelect = (vertical: string) => {
    const current = filters.verticals || []
    const updated = current.includes(vertical)
      ? current.filter((v) => v !== vertical)
      : [...current, vertical]
    setFilters({ ...filters, verticals: updated })
  }

  const handlePriceChange = (min: number, max: number) => {
    setFilters({ ...filters, priceRange: { min, max } })
  }

  const handleRatingChange = (rating: number) => {
    setFilters({ ...filters, ratingMin: rating })
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-secondary-900 mb-4">Filter Results</h3>

      <div className="space-y-6">
        {/* Verticals */}
        <div>
          <label className="label">Categories</label>
          <div className="flex flex-wrap gap-2">
            {verticals.map((vertical) => (
              <button
                key={vertical}
                onClick={() => handleVerticalSelect(vertical)}
                className={`badge ${
                  filters.verticals?.includes(vertical)
                    ? 'badge-primary'
                    : 'bg-secondary-100 text-secondary-600'
                } cursor-pointer`}
              >
                {vertical}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="label">Price Range (per hour)</label>
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange?.min || ''}
              onChange={(e) => handlePriceChange(Number(e.target.value), filters.priceRange?.max || 1000)}
              className="input w-1/2"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange?.max || ''}
              onChange={(e) => handlePriceChange(filters.priceRange?.min || 0, Number(e.target.value))}
              className="input w-1/2"
            />
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="label">Minimum Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRatingChange(rating)}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  filters.ratingMin === rating
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setFilters({})
              onApply()
            }}
            className="btn btn-secondary"
          >
            Clear All
          </button>
          <button onClick={onApply} className="btn btn-primary">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}
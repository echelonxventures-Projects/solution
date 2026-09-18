'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useSearchStore } from '@/stores'
import { SearchFilters } from '@/components/search/SearchFilters'
import { SearchResults } from '@/components/search/SearchResults'

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { query, setQuery, setResults, isSearching, setSearching } = useSearchStore()
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Get initial query from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    const vertical = searchParams.get('vertical')

    if (urlQuery) {
      setQuery(urlQuery)
    }
  }, [searchParams, setQuery])

  // Search query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return { consultants: [], total: 0 }
      setSearching(true)
      const response = await api.consultants.search(query, {
        vertical: searchParams.get('vertical'),
        limit: 20,
      })
      setSearching(false)
      return response.data
    },
    enabled: query.length > 0,
  })

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery)
    router.push(`/search?q=${encodeURIComponent(newQuery)}`)
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for consultants, expertise, or topics..."
              className="input flex-1"
            />
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="btn btn-secondary"
            >
              Filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
          <div className="mb-6">
            <SearchFilters onApply={() => {
              setFiltersOpen(false)
              refetch()
            }} />
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-secondary-600">Searching...</p>
          </div>
        ) : (
          <SearchResults results={data?.consultants || []} total={data?.total || 0} />
        )}
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}
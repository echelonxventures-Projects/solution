'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ConsultantProfileProps {
  consultantId: string
}

export function ConsultantProfile({ consultantId }: ConsultantProfileProps) {
  const { data: consultant, isLoading } = useQuery({
    queryKey: ['consultant', consultantId],
    queryFn: async () => {
      const response = await api.consultants.get(consultantId)
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="card">
        <LoadingSpinner />
      </div>
    )
  }

  if (!consultant) {
    return (
      <div className="card text-center py-12">
        <p className="text-secondary-600">Consultant not found</p>
      </div>
    )
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start gap-6 mb-6">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
          {consultant.profileImage ? (
            <img
              src={consultant.profileImage}
              alt={consultant.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <span className="text-primary-600 font-bold text-3xl">
              {consultant.name?.charAt(0) || 'C'}
            </span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-secondary-900">
              {consultant.name}
            </h1>
            {consultant.verified && (
              <span className="badge badge-success">Verified Expert</span>
            )}
          </div>

          <p className="text-lg text-secondary-600 mb-4">
            {consultant.title}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < Math.floor(consultant.rating || 4.5) ? 'text-yellow-400' : 'text-secondary-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-secondary-600">
              {consultant.rating?.toFixed(1) || '4.5'} ({consultant.reviewCount || 0} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="mb-6">
        <h2 className="font-semibold text-secondary-900 mb-2">About</h2>
        <p className="text-secondary-600 leading-relaxed">
          {consultant.bio || 'No bio available'}
        </p>
      </div>

      {/* Verticals */}
      <div className="mb-6">
        <h2 className="font-semibold text-secondary-900 mb-2">Expertise</h2>
        <div className="flex flex-wrap gap-2">
          {(consultant.verticals || []).map((vertical: string) => (
            <span key={vertical} className="badge badge-primary">
              {vertical}
            </span>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="mb-6">
        <h2 className="font-semibold text-secondary-900 mb-2">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {(consultant.skills || []).map((skill: string) => (
            <span key={skill} className="badge bg-secondary-100 text-secondary-700">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div className="mb-6">
        <h2 className="font-semibold text-secondary-900 mb-2">Languages</h2>
        <div className="flex gap-4">
          {(consultant.languages || ['English']).map((lang: string) => (
            <span key={lang} className="text-secondary-600">
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 bg-secondary-50 rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary-900">
            {consultant.totalSessions || 0}
          </div>
          <div className="text-sm text-secondary-600">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary-900">
            {consultant.responseTimeMinutes || 30}m
          </div>
          <div className="text-sm text-secondary-600">Response Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary-900">
            {consultant.repeatClients || 0}
          </div>
          <div className="text-sm text-secondary-600">Repeat Clients</div>
        </div>
      </div>
    </div>
  )
}
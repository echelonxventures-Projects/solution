'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'

interface ConsultantReviewsProps {
  consultantId: string
}

export function ConsultantReviews({ consultantId }: ConsultantReviewsProps) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', consultantId],
    queryFn: async () => {
      const response = await api.consultants.reviews(consultantId, { limit: 10 })
      return response.data.reviews || []
    },
  })

  if (isLoading) {
    return <div className="card">Loading reviews...</div>
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="card">
        <h2 className="font-semibold text-secondary-900 mb-4">Reviews</h2>
        <p className="text-secondary-500 text-center py-4">
          No reviews yet
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-secondary-900 mb-4">
        Reviews ({reviews.length})
      </h2>

      <div className="space-y-6">
        {reviews.map((review: any) => (
          <div key={review.id} className="border-b border-secondary-200 pb-6 last:border-0">
            {/* Header */}
            <div className="flex items-start gap-4 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-medium">
                  {review.seekerName?.charAt(0) || 'S'}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-secondary-900">
                    {review.seekerName || 'Anonymous'}
                  </span>
                  <span className="text-secondary-400 text-sm">
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-secondary-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <p className="text-secondary-600 leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
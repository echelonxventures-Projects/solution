'use client'

import { Suspense } from 'react'

import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('bookingId')

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const response = await api.bookings.get(bookingId!)
      return response.data
    },
    enabled: !!bookingId,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-secondary-900">Payment Successful!</h1>
          <p className="text-secondary-600 mt-2">
            Your booking has been confirmed
          </p>
        </div>

        {/* Booking Details */}
        {booking && (
          <div className="card mb-8">
            <h2 className="font-semibold text-secondary-900 mb-4">Booking Details</h2>

            <div className="flex items-start gap-4 mb-6">
              <img
                src={booking.consultant?.avatar || '/avatar-placeholder.png'}
                alt={booking.consultant?.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <div className="font-medium text-secondary-900">
                  {booking.consultant?.name}
                </div>
                <div className="text-secondary-500 text-sm">
                  {booking.consultant?.vertical?.name}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Session Date</span>
                <span className="font-medium text-secondary-900">
                  {formatDate(booking.scheduledStart)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Session Time</span>
                <span className="font-medium text-secondary-900">
                  {formatTime(booking.scheduledStart)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Duration</span>
                <span className="font-medium text-secondary-900">
                  {booking.durationMinutes} minutes
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-secondary-200">
                <span className="text-secondary-600">Amount Paid</span>
                <span className="font-semibold text-secondary-900">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Booking ID</span>
                <span className="text-secondary-500">
                  {bookingId}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Email */}
        <div className="card bg-primary-50 border border-primary-100 mb-8">
          <div className="flex items-center gap-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="font-medium text-secondary-900">
                Confirmation email sent
              </p>
              <p className="text-secondary-600 text-sm">
                Check your inbox for booking details and calendar invite
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Integration */}
        <div className="card mb-8">
          <h2 className="font-semibold text-secondary-900 mb-4">Add to Calendar</h2>
          <div className="flex gap-4">
            <button className="btn btn-secondary flex-1 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
              </svg>
              Google Calendar
            </button>
            <button className="btn btn-secondary flex-1 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" />
              </svg>
              Outlook
            </button>
            <button className="btn btn-secondary flex-1 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
              </svg>
              Apple Calendar
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/dashboard" className="btn btn-primary flex-1">
            View My Dashboard
          </Link>
          <Link href="/search" className="btn btn-secondary flex-1">
            Book Another Session
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}

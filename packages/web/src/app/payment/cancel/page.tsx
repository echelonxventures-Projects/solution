'use client'

import { Suspense } from 'react'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PaymentCancelContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cancel Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-secondary-900">Payment Cancelled</h1>
          <p className="text-secondary-600 mt-2">
            Your payment was not completed
          </p>
        </div>

        {/* Info Card */}
        <div className="card mb-8">
          <p className="text-secondary-600">
            Your booking has not been confirmed. No charges have been made to your account.
            You can try again or choose a different payment method.
          </p>
        </div>

        {/* Booking Still Available */}
        {bookingId && (
          <div className="card bg-yellow-50 border border-yellow-100 mb-8">
            <div className="flex items-center gap-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-secondary-900">
                  Your selected time slot is still available
                </p>
                <p className="text-secondary-600 text-sm">
                  Complete payment now to secure your booking
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {bookingId && (
            <Link href={`/payment?bookingId=${bookingId}`} className="btn btn-primary flex-1">
              Try Again
            </Link>
          )}
          <Link href="/search" className="btn btn-secondary flex-1">
            Find Another Consultant
          </Link>
        </div>

        {/* Help */}
        <div className="text-center mt-8">
          <p className="text-secondary-500">
            Having trouble with payment?{' '}
            <Link href="/support" className="text-primary-600 hover:text-primary-700">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-secondary-50" />}>
      <PaymentCancelContent />
    </Suspense>
  )
}

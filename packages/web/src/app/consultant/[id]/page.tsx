'use client'

import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { ConsultantProfile } from '@/components/consultant/ConsultantProfile'
import { ConsultantAvailability } from '@/components/consultant/ConsultantAvailability'
import { ConsultantReviews } from '@/components/consultant/ConsultantReviews'
import { BookingModal } from '@/components/booking/BookingModal'

interface ConsultantDetailProps {
  params: { id: string }
}

function ConsultantDetailContent({ params }: ConsultantDetailProps) {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2">
            <ConsultantProfile consultantId={params.id} />
            <ConsultantReviews consultantId={params.id} />
          </div>

          {/* Sidebar */}
          <div>
            <ConsultantAvailability consultantId={params.id} />
            <BookingModal consultantId={params.id} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ConsultantPage({ params }: ConsultantDetailProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConsultantDetailContent params={params} />
    </Suspense>
  )
}
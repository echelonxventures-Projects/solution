'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ConsultantAvailabilityProps {
  consultantId: string
}

export function ConsultantAvailability({ consultantId }: ConsultantAvailabilityProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { data: slots, isLoading } = useQuery({
    queryKey: ['availability', consultantId, selectedDate],
    queryFn: async () => {
      const response = await api.consultants.availability(consultantId, {
        date: selectedDate.toISOString().split('T')[0],
      })
      return response.data.slots || []
    },
  })

  const dates = [...Array(7)].map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })

  return (
    <div className="card">
      <h2 className="font-semibold text-secondary-900 mb-4">Availability</h2>

      {/* Date Selection */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {dates.map((date) => (
          <button
            key={date.toISOString()}
            onClick={() => setSelectedDate(date)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg ${
              date.toDateString() === selectedDate.toDateString()
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
            }`}
          >
            <div className="text-xs">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="font-medium">
              {date.getDate()}
            </div>
          </button>
        ))}
      </div>

      {/* Time Slots */}
      {isLoading ? (
        <LoadingSpinner />
      ) : slots && slots.length > 0 ? (
        <div className="space-y-2">
          {slots.map((slot: any) => (
            <div
              key={slot.id}
              className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-secondary-900 font-medium">
                  {formatTime(slot.startTime)}
                </span>
                <span className="text-secondary-500">
                  - {formatTime(slot.endTime)}
                </span>
              </div>
              <span className="text-primary-600 font-medium">
                {formatCurrency(slot.price || 0)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-secondary-500 text-center py-4">
          No available slots for this date
        </p>
      )}

      {/* Price Info */}
      <div className="mt-6 pt-6 border-t border-secondary-200">
        <div className="flex items-center justify-between">
          <span className="text-secondary-600">Rate per hour</span>
          <span className="font-semibold text-secondary-900">
            {/* Price would come from consultant data */}
            $100
          </span>
        </div>
      </div>
    </div>
  )
}
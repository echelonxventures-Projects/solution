'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { bookingSchema, BookingInput } from '@/lib/validations'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/stores'

interface BookingModalProps {
  consultantId: string
}

export function BookingModal({ consultantId }: BookingModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
  })

  const handleBook = async (data: BookingInput) => {
    if (!isAuthenticated) {
      toast.error('Please log in to book a session')
      return
    }

    try {
      const response = await api.bookings.create({
        consultantId,
        scheduledStart: selectedSlot.startTime,
        durationMinutes: 60,
        notes: data.notes,
      })

      toast.success('Booking created! Proceed to payment.')
      setIsOpen(false)
      // Redirect to payment or booking confirmation
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Booking failed')
    }
  }

  return (
    <>
      {/* Book Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary w-full mt-6"
        disabled={!isAuthenticated}
      >
        {isAuthenticated ? 'Book a Session' : 'Log in to Book'}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-secondary-900 mb-4">
              Book Your Session
            </h2>

            {/* Session Details */}
            {selectedSlot && (
              <div className="bg-secondary-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-secondary-600">Duration</span>
                  <span className="font-medium">60 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Total</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(100)}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <form onSubmit={handleSubmit(handleBook)} className="space-y-4">
              <div>
                <label className="label">Session Notes (optional)</label>
                <textarea
                  {...register('notes')}
                  className="input min-h-[100px]"
                  placeholder="What would you like to discuss?"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

export default function ConsultantAvailabilityPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [newSlot, setNewSlot] = useState({
    startTime: '09:00',
    endTime: '10:00',
    recurring: false,
  })
  const queryClient = useQueryClient()

  const { data: availability, isLoading } = useQuery({
    queryKey: ['consultant', 'availability'],
    queryFn: async () => {
      const response = await api.consultants.getAvailability()
      return response.data
    },
  })

  const addSlotMutation = useMutation({
    mutationFn: async (slot: any) => {
      const response = await api.consultants.addSlot({
        date: selectedDate.toISOString().split('T')[0],
        startTime: slot.startTime,
        endTime: slot.endTime,
        recurring: slot.recurring,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant', 'availability'] })
      toast.success('Slot added successfully')
      setShowAddSlot(false)
      setNewSlot({ startTime: '09:00', endTime: '10:00', recurring: false })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add slot')
    },
  })

  const removeSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      await api.consultants.removeSlot(slotId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant', 'availability'] })
      toast.success('Slot removed')
    },
  })

  const generateSlotsMutation = useMutation({
    mutationFn: async () => {
      await api.consultants.generateSlots({
        startDate: selectedDate.toISOString().split('T')[0],
        weeks: 4,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultant', 'availability'] })
      toast.success('Slots generated for 4 weeks')
    },
  })

  const days = [...Array(7)].map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })

  const getSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return availability?.slots?.filter((s: any) => s.date === dateStr) || []
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Manage Availability</h1>
            <p className="text-secondary-600 mt-2">
              Set your available hours for consultations
            </p>
          </div>
          <button
            onClick={() => generateSlotsMutation.mutate()}
            className="btn btn-secondary"
            disabled={generateSlotsMutation.isPending}
          >
            {generateSlotsMutation.isPending ? 'Generating...' : 'Auto-Generate 4 Weeks'}
          </button>
        </div>

        {/* Working Hours Settings */}
        <div className="card mb-8">
          <h2 className="font-semibold text-secondary-900 mb-4">Default Working Hours</h2>
          <div className="grid grid-cols-7 gap-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} className="text-center">
                <div className="font-medium text-secondary-900 mb-2">{day}</div>
                <input
                  type="checkbox"
                  defaultChecked={i < 5}
                  className="toggle"
                />
                <div className="text-secondary-500 text-xs mt-1">
                  {i < 5 ? '9AM-5PM' : 'Off'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div className="card mb-8">
          <h2 className="font-semibold text-secondary-900 mb-4">Select Date</h2>
          <div className="flex gap-2">
            {days.map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 px-4 py-3 rounded-lg ${
                  date.toDateString() === selectedDate.toDateString()
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                <div className="text-xs">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="font-medium text-lg">
                  {date.getDate()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-secondary-900">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <button
              onClick={() => setShowAddSlot(true)}
              className="btn btn-primary btn-sm"
            >
              Add Slot
            </button>
          </div>

          {showAddSlot && (
            <div className="mb-6 p-4 bg-primary-50 rounded-lg">
              <h3 className="font-medium text-secondary-900 mb-4">Add New Slot</h3>
              <div className="flex gap-4">
                <div>
                  <label className="label text-xs">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label text-xs">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="input"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSlot.recurring}
                    onChange={(e) => setNewSlot({ ...newSlot, recurring: e.target.checked })}
                  />
                  <span className="text-secondary-600">Recurring weekly</span>
                </label>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => addSlotMutation.mutate(newSlot)}
                  className="btn btn-primary btn-sm"
                  disabled={addSlotMutation.isPending}
                >
                  {addSlotMutation.isPending ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => setShowAddSlot(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {getSlotsForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getSlotsForDate(selectedDate).map((slot: any) => (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    slot.status === 'booked'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-secondary-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-secondary-900 font-medium">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    {slot.recurring && (
                      <span className="bg-primary-100 text-primary-600 px-2 py-1 rounded text-xs">
                        Recurring
                      </span>
                    )}
                    {slot.status === 'booked' && (
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                        Booked
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-secondary-900 font-medium">
                      {formatCurrency(slot.price || availability?.hourlyRate || 0)}
                    </span>
                    {slot.status !== 'booked' && (
                      <button
                        onClick={() => removeSlotMutation.mutate(slot.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={removeSlotMutation.isPending}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-secondary-500 mb-4">
                No slots available for this date
              </p>
              <button
                onClick={() => setShowAddSlot(true)}
                className="btn btn-primary"
              >
                Add Availability Slot
              </button>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        <div className="card mt-8">
          <h2 className="font-semibold text-secondary-900 mb-4">Bulk Actions</h2>
          <div className="flex gap-4">
            <button className="btn btn-secondary">
              Copy Today to Week
            </button>
            <button className="btn btn-secondary">
              Block Next Week
            </button>
            <button className="btn bg-red-600 hover:bg-red-700 text-white">
              Clear All Slots
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { profileSchema, ProfileInput } from '@/lib/validations'
import { useAuthStore } from '@/stores'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'notifications'>('profile')
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await api.users.profile()
      return response.data
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: profile,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileInput) => {
      const response = await api.users.updateProfile(data)
      return response.data
    },
    onSuccess: (data) => {
      setUser(data)
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    },
  })

  const onSubmit = (data: ProfileInput) => {
    updateMutation.mutate(data)
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Profile Settings</h1>
          <p className="text-secondary-600 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'profile'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-secondary-600 hover:bg-secondary-100'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'settings'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-secondary-600 hover:bg-secondary-100'
            }`}
          >
            Account Settings
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'notifications'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-secondary-600 hover:bg-secondary-100'
            }`}
          >
            Notifications
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img
                    src={profile?.avatar || user?.profileImage || '/avatar-placeholder.png'}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900">Profile Photo</h3>
                  <p className="text-secondary-500 text-sm">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">First Name</label>
                  <input
                    {...register('firstName')}
                    className="input"
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input
                    {...register('lastName')}
                    className="input"
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="input"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="input"
                  placeholder="+1 (555) 000-0000"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="label">Bio</label>
                <textarea
                  {...register('bio')}
                  className="input min-h-[100px]"
                  placeholder="Tell us about yourself..."
                />
                {errors.bio && (
                  <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
                )}
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Country</label>
                  <select {...register('country')} className="input">
                    <option value="">Select country</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="IN">India</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>
                <div>
                  <label className="label">Language</label>
                  <select {...register('language')} className="input">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="card space-y-6">
            {/* Change Password */}
            <div>
              <h3 className="font-semibold text-secondary-900 mb-4">Change Password</h3>
              <form className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input type="password" className="input" placeholder="Enter current password" />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input" placeholder="Enter new password" />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" className="input" placeholder="Confirm new password" />
                </div>
                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
              </form>
            </div>

            {/* Two-Factor Auth */}
            <div className="border-t border-secondary-200 pt-6">
              <h3 className="font-semibold text-secondary-900 mb-4">Two-Factor Authentication</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary-600">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <button className="btn btn-secondary">Enable 2FA</button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="border-t border-secondary-200 pt-6">
              <h3 className="font-semibold text-red-600 mb-4">Delete Account</h3>
              <p className="text-secondary-600 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button className="btn bg-red-600 hover:bg-red-700 text-white">
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="card space-y-6">
            <h3 className="font-semibold text-secondary-900 mb-4">
              Notification Preferences
            </h3>

            {/* Email Notifications */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">Email Notifications</p>
                  <p className="text-secondary-500 text-sm">
                    Receive booking confirmations via email
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">Session Reminders</p>
                  <p className="text-secondary-500 text-sm">
                    Get reminders before scheduled sessions
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">Marketing Emails</p>
                  <p className="text-secondary-500 text-sm">
                    Receive updates about new features and offers
                  </p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
            </div>

            {/* Push Notifications */}
            <div className="border-t border-secondary-200 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">Push Notifications</p>
                  <p className="text-secondary-500 text-sm">
                    Receive notifications on your device
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">SMS Notifications</p>
                  <p className="text-secondary-500 text-sm">
                    Receive text messages for urgent updates
                  </p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="border-t border-secondary-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">WhatsApp Integration</p>
                  <p className="text-secondary-500 text-sm">
                    Connect your WhatsApp for seamless communication
                  </p>
                </div>
                <button className="btn btn-secondary">Connect WhatsApp</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
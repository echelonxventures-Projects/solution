'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { consultantOnboardingSchema, ConsultantOnboardingInput } from '@/lib/validations'
import { useAuthStore } from '@/stores'
import { useRouter } from 'next/navigation'

const ONBOARDING_STEPS = [
  { id: 'profile', title: 'Profile Information', description: 'Tell us about yourself' },
  { id: 'expertise', title: 'Expertise & Skills', description: 'Define your consultation areas' },
  { id: 'availability', title: 'Availability', description: 'Set your working hours' },
  { id: 'pricing', title: 'Pricing', description: 'Set your consultation rates' },
  { id: 'verification', title: 'Verification', description: 'Verify your credentials' },
]

export default function ConsultantOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([])
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ConsultantOnboardingInput>({
    resolver: zodResolver(consultantOnboardingSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      verticalId: '',
      subVerticalId: '',
      skills: [],
      experienceYears: 0,
      bio: '',
      hourlyRate: 0,
      languages: ['en'],
      availability: {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '13:00', available: false },
        sunday: { start: '09:00', end: '13:00', available: false },
      },
      credentials: [],
    },
  })

  const onboardingMutation = useMutation({
    mutationFn: async (data: ConsultantOnboardingInput) => {
      const response = await api.consultants.onboard(data)
      return response.data
    },
    onSuccess: (data) => {
      setUser({ ...user, ...data, role: 'consultant' })
      toast.success('Onboarding complete! Your profile is under review.')
      router.push('/consultant/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Onboarding failed')
    },
  })

  const onSubmit = (data: ConsultantOnboardingInput) => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onboardingMutation.mutate(data)
    }
  }

  const handleFileUpload = (files: FileList) => {
    // Handle document upload for verification
    const fileArray = Array.from(files)
    // In real implementation, upload to storage and get URLs
    setUploadedDocuments((prev) => [...prev, ...fileArray.map((f) => f.name)])
  }

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1))
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">
            Become a Consultant
          </h1>
          <p className="text-secondary-600 mt-2">
            Complete your profile to start offering consultations
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {ONBOARDING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index !== ONBOARDING_STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-200 text-secondary-500'
                  }`}
                >
                  {index < currentStep ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index !== ONBOARDING_STEPS.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div
                      className={`h-1 rounded ${
                        index < currentStep ? 'bg-primary-600' : 'bg-secondary-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {ONBOARDING_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`${index !== ONBOARDING_STEPS.length - 1 ? 'flex-1' : ''} text-center`}
              >
                <div className="text-sm font-medium text-secondary-900">
                  {step.title}
                </div>
                <div className="text-xs text-secondary-500">
                  {step.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="card">
          {/* Step 1: Profile Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                Profile Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">First Name</label>
                  <input {...register('firstName')} className="input" />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input {...register('lastName')} className="input" />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input type="email" {...register('email')} className="input" />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input type="tel" {...register('phone')} className="input" placeholder="+1 (555) 000-0000" />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="label">Profile Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-secondary-200 flex items-center justify-center">
                    <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <button type="button" className="btn btn-secondary">
                    Upload Photo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Expertise & Skills */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                Expertise & Skills
              </h2>

              <div>
                <label className="label">Primary Vertical</label>
                <select {...register('verticalId')} className="input">
                  <option value="">Select your primary area</option>
                  <option value="tech">Technology</option>
                  <option value="business">Business</option>
                  <option value="health">Health & Wellness</option>
                  <option value="legal">Legal</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="career">Career Development</option>
                  <option value="creative">Creative Arts</option>
                </select>
                {errors.verticalId && (
                  <p className="text-red-500 text-sm mt-1">{errors.verticalId.message}</p>
                )}
              </div>

              <div>
                <label className="label">Sub-Vertical (Specialization)</label>
                <select {...register('subVerticalId')} className="input">
                  <option value="">Select specialization</option>
                  <option value="software">Software Development</option>
                  <option value="data">Data Science</option>
                  <option value="cloud">Cloud Architecture</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="mobile">Mobile Development</option>
                  <option value="ai">AI & Machine Learning</option>
                </select>
              </div>

              <div>
                <label className="label">Years of Experience</label>
                <input
                  type="number"
                  {...register('experienceYears', { valueAsNumber: true })}
                  className="input"
                  min="0"
                  max="50"
                />
                {errors.experienceYears && (
                  <p className="text-red-500 text-sm mt-1">{errors.experienceYears.message}</p>
                )}
              </div>

              <div>
                <label className="label">Skills (comma-separated)</label>
                <input
                  {...register('skills')}
                  className="input"
                  placeholder="e.g., React, Node.js, Python, AWS, Docker"
                />
              </div>

              <div>
                <label className="label">Languages Spoken</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('languages')} value="en" defaultChecked />
                    <span>English</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('languages')} value="es" />
                    <span>Spanish</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('languages')} value="fr" />
                    <span>French</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('languages')} value="de" />
                    <span>German</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Professional Bio</label>
                <textarea
                  {...register('bio')}
                  className="input min-h-[150px]"
                  placeholder="Describe your background, expertise, and what makes you unique..."
                />
                {errors.bio && (
                  <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Availability */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                Set Your Availability
              </h2>

              <p className="text-secondary-600 mb-4">
                Define your working hours for consultations. You can adjust these later.
              </p>

              {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                <div key={day} className="flex items-center gap-4 p-4 bg-secondary-50 rounded-lg">
                  <label className="flex items-center gap-2 min-w-[120px]">
                    <input
                      type="checkbox"
                      {...register(`availability.${day}.available`)}
                      defaultChecked={day !== 'saturday' && day !== 'sunday'}
                    />
                    <span className="font-medium text-secondary-900 capitalize">
                      {day}
                    </span>
                  </label>

                  {watch(`availability.${day}.available`) && (
                    <div className="flex gap-4">
                      <div>
                        <label className="label text-xs">Start</label>
                        <input
                          type="time"
                          {...register(`availability.${day}.start`)}
                          className="input"
                          defaultValue="09:00"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">End</label>
                        <input
                          type="time"
                          {...register(`availability.${day}.end`)}
                          className="input"
                          defaultValue={day === 'saturday' || day === 'sunday' ? '13:00' : '17:00'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                Pricing & Rates
              </h2>

              <div>
                <label className="label">Hourly Rate (USD)</label>
                <input
                  type="number"
                  {...register('hourlyRate', { valueAsNumber: true })}
                  className="input"
                  min="10"
                  max="1000"
                  placeholder="e.g., 100"
                />
                {errors.hourlyRate && (
                  <p className="text-red-500 text-sm mt-1">{errors.hourlyRate.message}</p>
                )}
                <p className="text-secondary-500 text-sm mt-2">
                  Platform fee: 15% per session. You receive 85% of the total.
                </p>
              </div>

              <div className="p-4 bg-secondary-50 rounded-lg">
                <h3 className="font-medium text-secondary-900 mb-2">Pricing Example</h3>
                <div className="flex justify-between text-secondary-600">
                  <span>Your rate: $100/hour</span>
                  <span>Seeker pays: $100</span>
                </div>
                <div className="flex justify-between text-secondary-600">
                  <span>Platform fee (15%)</span>
                  <span>-$15</span>
                </div>
                <div className="flex justify-between font-medium text-secondary-900 pt-2 border-t border-secondary-200 mt-2">
                  <span>You earn</span>
                  <span>$85</span>
                </div>
              </div>

              <div>
                <label className="label">Additional Pricing Options</label>
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Offer 30-minute sessions at half rate</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Offer package deals (4+ sessions with discount)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Offer free introductory session (15 min)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Verification */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                Verification Documents
              </h2>

              <p className="text-secondary-600 mb-4">
                Upload documents to verify your credentials. This helps build trust with seekers.
              </p>

              <div>
                <label className="label">Document Type</label>
                <select className="input">
                  <option value="degree">University Degree</option>
                  <option value="certificate">Professional Certificate</option>
                  <option value="license">Professional License</option>
                  <option value="portfolio">Portfolio/Work Samples</option>
                  <option value="recommendation">Recommendation Letters</option>
                </select>
              </div>

              <div>
                <label className="label">Upload Document</label>
                <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    accept=".pdf,.jpg,.png"
                    multiple
                  />
                  <button
                    type="button"
                    onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement | null)?.click()}
                    className="btn btn-secondary"
                  >
                    Choose Files
                  </button>
                  <p className="text-secondary-500 text-sm mt-2">
                    PDF, JPG, PNG up to 5MB each
                  </p>
                </div>
              </div>

              {uploadedDocuments.length > 0 && (
                <div>
                  <label className="label">Uploaded Documents</label>
                  <div className="space-y-2">
                    {uploadedDocuments.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-secondary-50 rounded">
                        <span className="text-secondary-900">{doc}</span>
                        <button
                          type="button"
                          onClick={() => setUploadedDocuments(uploadedDocuments.filter((_, j) => j !== i))}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  Your profile will be reviewed after submission. Verification typically takes 2-3 business days.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-secondary-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>

            {currentStep === ONBOARDING_STEPS.length - 1 ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                Continue
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
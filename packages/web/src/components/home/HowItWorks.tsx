const steps = [
  {
    step: 1,
    title: 'Find Your Expert',
    description: 'Search for consultants by expertise, industry, or specific needs. Browse profiles, ratings, and reviews.',
    icon: '🔍',
  },
  {
    step: 2,
    title: 'Book a Session',
    description: 'Choose your preferred time, select session duration, and confirm your booking with secure payment.',
    icon: '📅',
  },
  {
    step: 3,
    title: 'Connect & Learn',
    description: 'Join your video session, interact with your consultant, and get personalized advice and solutions.',
    icon: '📹',
  },
  {
    step: 4,
    title: 'Review & Follow-up',
    description: 'Rate your experience, leave a review, and access session recordings and follow-up resources.',
    icon: '⭐',
  },
]

export function HowItWorks() {
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          How It Works
        </h2>
        <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
          Get expert consultation in four simple steps
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.step} className="relative bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              {/* Step Number */}
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <span className="text-white font-bold">{step.step}</span>
              </div>

              {/* Icon */}
              <div className="text-4xl mb-4">{step.icon}</div>

              {/* Content */}
              <h3 className="font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
'use client'

import { Suspense } from 'react'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'

function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
  const [isProcessing, setIsProcessing] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const response = await api.bookings.get(bookingId!)
      return response.data
    },
    enabled: !!bookingId,
  })

  const paymentMutation = useMutation({
    mutationFn: async (method: 'stripe' | 'paypal') => {
      setIsProcessing(true)
      if (method === 'stripe') {
        const response = await api.payments.createStripePaymentIntent({
          bookingId: bookingId!,
        })
        return { type: 'stripe', clientSecret: response.data.clientSecret }
      } else {
        const response = await api.payments.createPayPalOrder({
          bookingId: bookingId!,
        })
        return { type: 'paypal', orderId: response.data.orderId }
      }
    },
    onSuccess: async (data) => {
      if (data.type === 'stripe') {
        // In real implementation, use Stripe.js to handle payment
        // For now, simulate success
        setTimeout(() => {
          setIsProcessing(false)
          toast.success('Payment successful!')
          router.push(`/payment/success?bookingId=${bookingId}`)
        }, 2000)
      } else {
        // Redirect to PayPal
        setIsProcessing(false)
        // window.location.href = `https://www.paypal.com/checkoutnow?token=${data.orderId}`
        // For demo, simulate success
        toast.success('Redirecting to PayPal...')
        setTimeout(() => {
          router.push(`/payment/success?bookingId=${bookingId}`)
        }, 1500)
      }
    },
    onError: (error: any) => {
      setIsProcessing(false)
      toast.error(error.response?.data?.error || 'Payment failed')
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">
            Booking not found
          </h1>
          <button onClick={() => router.push('/search')} className="btn btn-primary">
            Find a Consultant
          </button>
        </div>
      </div>
    )
  }

  const subtotal = booking.totalAmount
  const platformFee = subtotal * 0.05 // 5% platform fee for seeker
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + platformFee + tax

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">Complete Payment</h1>
          <p className="text-secondary-600 mt-2">
            Secure payment powered by Stripe & PayPal
          </p>
        </div>

        {/* Booking Summary */}
        <div className="card mb-8">
          <h2 className="font-semibold text-secondary-900 mb-4">Booking Summary</h2>

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
              <div className="text-primary-600 font-medium mt-2">
                {booking.durationMinutes} minutes session
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-secondary-200 pt-4 space-y-3">
            <div className="flex justify-between text-secondary-600">
              <span>Session Fee</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-secondary-600">
              <span>Platform Fee</span>
              <span>{formatCurrency(platformFee)}</span>
            </div>
            <div className="flex justify-between text-secondary-600">
              <span>Tax (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-secondary-900 pt-3 border-t border-secondary-200">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card mb-8">
          <h2 className="font-semibold text-secondary-900 mb-4">Payment Method</h2>

          <div className="space-y-4">
            {/* Stripe */}
            <button
              onClick={() => setPaymentMethod('stripe')}
              className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 ${
                paymentMethod === 'stripe'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-secondary-200 bg-white'
              }`}
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.546.93 6.203 1.737l.852-5.28C18.3 1.13 15.776.27 12.621.27c-2.227 0-4.093.592-5.533 1.737C5.635 3.152 4.817 4.796 4.817 6.77c0 4.153 3.2 5.697 6.159 6.757 2.227.806 3.356 1.426 3.356 2.409 0 .944-.818 1.574-2.172 1.574-1.86 0-4.546-.806-6.4-1.917l-.933 5.406c2.172.93 4.546 1.426 7.353 1.426 2.454 0 4.455-.614 5.9-1.826 1.518-1.305 2.227-3.097 2.227-5.46-.03-4.153-3.27-5.697-6.33-6.757z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-secondary-900">Credit/Debit Card</div>
                <div className="text-secondary-500 text-sm">
                  Pay securely with Stripe
                </div>
              </div>
              {paymentMethod === 'stripe' && (
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* PayPal */}
            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`w-full p-4 rounded-lg border-2 flex items-center gap-4 ${
                paymentMethod === 'paypal'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-secondary-200 bg-white'
              }`}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.771.771 0 0 1 .757-.641h6.878c2.319 0 4.083.474 5.238 1.386 1.155.912 1.611 2.28 1.37 4.095-.325 2.22-1.318 3.972-2.953 5.186-1.635 1.214-3.734 1.82-6.292 1.82H8.712a.771.771 0 0 0-.757.641l-.9 5.843a.641.641 0 0 1-.633.74l.054.002z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-medium text-secondary-900">PayPal</div>
                <div className="text-secondary-500 text-sm">
                  Pay with your PayPal account
                </div>
              </div>
              {paymentMethod === 'paypal' && (
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Card Details (for Stripe) */}
        {paymentMethod === 'stripe' && (
          <div className="card mb-8">
            <h2 className="font-semibold text-secondary-900 mb-4">Card Details</h2>

            {/* In real implementation, use Stripe Elements */}
            <div className="space-y-4">
              <div>
                <label className="label">Card Number</label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="input"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-secondary-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm">
                Your payment is secured with SSL encryption
              </span>
            </div>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={() => paymentMutation.mutate(paymentMethod)}
          disabled={isProcessing}
          className="btn btn-primary w-full py-4 text-lg font-semibold"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Processing...
            </span>
          ) : (
            `Pay ${formatCurrency(total)}`
          )}
        </button>

        {/* Terms */}
        <p className="text-secondary-500 text-sm text-center mt-4">
          By completing this payment, you agree to our Terms of Service and Privacy Policy.
          Cancellations within 24 hours of the session may incur a fee.
        </p>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PaymentPageContent />
    </Suspense>
  )
}

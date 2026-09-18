import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { api } from '@lib/api'
import { formatCurrency } from '@lib/utils'

export default function PaymentScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { bookingId } = route.params as { bookingId: string }
  const [paymentMethod, setPaymentMethod] = React.useState<'stripe' | 'paypal'>('stripe')
  const [isProcessing, setIsProcessing] = React.useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const response = await api.bookings.get(bookingId)
      return response.data
    },
  })

  const stripeMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true)
      const response = await api.payments.createIntent({
        bookingId,
      })
      return response.data
    },
    onSuccess: () => {
      setIsProcessing(false)
      Toast.show({
        type: 'success',
        text1: 'Payment successful!',
      })
      navigation.navigate('Dashboard')
    },
    onError: (_error: any) => {
      setIsProcessing(false)
      Toast.show({
        type: 'error',
        text1: 'Payment failed',
        text2: error.response?.data?.error || 'Please try again',
      })
    },
  })

  const paypalMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true)
      const response = await api.payments.createPayPalOrder({
        bookingId,
      })
      return response.data
    },
    onSuccess: () => {
      setIsProcessing(false)
      Toast.show({
        type: 'success',
        text1: 'Payment successful!',
      })
      navigation.navigate('Dashboard')
    },
    onError: (_error: any) => {
      setIsProcessing(false)
      Toast.show({
        type: 'error',
        text1: 'Payment failed',
      })
    },
  })

  const handlePayment = () => {
    if (paymentMethod === 'stripe') {
      stripeMutation.mutate()
    } else {
      paypalMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  const subtotal = booking?.totalAmount || 0
  const platformFee = subtotal * 0.05
  const tax = subtotal * 0.1
  const total = subtotal + platformFee + tax

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Complete Payment</Text>
        <Text style={styles.subtitle}>
          Secure payment powered by Stripe & PayPal
        </Text>
      </View>

      {/* Booking Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Booking Summary</Text>
        <View style={styles.consultantRow}>
          <Image
            source={{ uri: booking?.consultant?.avatar || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.consultantName}>{booking?.consultant?.name}</Text>
            <Text style={styles.consultantVertical}>
              {booking?.consultant?.vertical?.name}
            </Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Session Fee</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Platform Fee</Text>
          <Text style={styles.summaryValue}>{formatCurrency(platformFee)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Method</Text>

        <TouchableOpacity
          style={[
            styles.methodCard,
            paymentMethod === 'stripe' && styles.methodCardSelected,
          ]}
          onPress={() => setPaymentMethod('stripe')}
        >
          <View style={styles.methodIcon}>
            <Ionicons name="card" size={24} color="#6366f1" />
          </View>
          <View style={styles.methodContent}>
            <Text style={styles.methodName}>Credit/Debit Card</Text>
            <Text style={styles.methodDesc}>Pay securely with Stripe</Text>
          </View>
          {paymentMethod === 'stripe' && (
            <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.methodCard,
            paymentMethod === 'paypal' && styles.methodCardSelected,
          ]}
          onPress={() => setPaymentMethod('paypal')}
        >
          <View style={styles.methodIcon}>
            <Ionicons name="wallet" size={24} color="#003087" />
          </View>
          <View style={styles.methodContent}>
            <Text style={styles.methodName}>PayPal</Text>
            <Text style={styles.methodDesc}>Pay with PayPal account</Text>
          </View>
          {paymentMethod === 'paypal' && (
            <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
          )}
        </TouchableOpacity>
      </View>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              Pay {formatCurrency(total)}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By completing this payment, you agree to our Terms of Service.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  consultantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  consultantName: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  consultantVertical: {
    marginLeft: 12,
    fontSize: 14,
    color: '#64748b',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    color: '#0f172a',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  methodCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodContent: {
    flex: 1,
    marginLeft: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  methodDesc: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  payButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    marginTop: 16,
  },
})
import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Toast from 'react-native-toast-message'
import { api } from '@lib/api'
import { formatCurrency, formatDate, formatTime } from '@lib/utils'

const bookingSchema = z.object({
  notes: z.string().max(500).optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

export default function BookingScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { consultantId } = route.params as { consultantId: string }

  const { data: consultant, isLoading: consultantLoading } = useQuery({
    queryKey: ['consultant', consultantId],
    queryFn: async () => {
      const response = await api.consultants.get(consultantId)
      return response.data
    },
  })

  const { data: availability } = useQuery({
    queryKey: ['consultant', consultantId, 'availability'],
    queryFn: async () => {
      const response = await api.consultants.availability(consultantId)
      return response.data.slots || []
    },
    enabled: !!consultantId,
  })

  const [selectedSlot, setSelectedSlot] = React.useState<any>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  })

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await api.bookings.create({
        consultantId,
        slotId: selectedSlot.id,
        scheduledStart: selectedSlot.startTime,
        durationMinutes: 60,
        notes: data.notes,
      })
      return response.data
    },
    onSuccess: (data) => {
      Toast.show({
        type: 'success',
        text1: 'Booking created!',
        text2: 'Proceed to payment',
      })
      navigation.navigate('Payment', { bookingId: data.id })
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Booking failed',
        text2: error.response?.data?.error || 'Please try again',
      })
    },
  })

  const onSubmit = (data: BookingFormData) => {
    if (!selectedSlot) {
      Alert.alert('Select a time slot', 'Please select an available time slot to book.')
      return
    }
    bookingMutation.mutate(data)
  }

  if (consultantLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  const subtotal = selectedSlot?.price || consultant?.hourlyRate || 0
  const platformFee = subtotal * 0.05
  const tax = subtotal * 0.1
  const total = subtotal + platformFee + tax

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Session</Text>
      </View>

      {/* Consultant Info */}
      <View style={styles.consultantCard}>
        <Image
          source={{ uri: consultant?.avatar || 'https://via.placeholder.com/60' }}
          style={styles.consultantAvatar}
        />
        <View style={styles.consultantInfo}>
          <Text style={styles.consultantName}>{consultant?.name}</Text>
          <Text style={styles.consultantVertical}>{consultant?.vertical?.name}</Text>
          <Text style={styles.consultantRate}>
            {formatCurrency(consultant?.hourlyRate)}/hour
          </Text>
        </View>
      </View>

      {/* Available Slots */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Time</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {availability?.map((slot: any) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotCard,
                selectedSlot?.id === slot.id && styles.slotCardSelected,
              ]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={styles.slotDate}>{formatDate(slot.startTime)}</Text>
              <Text style={styles.slotTime}>{formatTime(slot.startTime)}</Text>
              <Text style={styles.slotPrice}>{formatCurrency(slot.price)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {availability?.length === 0 && (
          <Text style={styles.emptyText}>No available slots</Text>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Notes (Optional)</Text>
        <Controller
          control={control}
          name="notes"
          render={({ field }) => (
            <View>
              <TextInput
                {...field}
                style={[styles.input, errors.notes && styles.inputError]}
                placeholder="What would you like to discuss?"
                multiline
                numberOfLines={4}
              />
              {errors.notes && (
                <Text style={styles.errorText}>{errors.notes.message}</Text>
              )}
            </View>
          )}
        />
      </View>

      {/* Price Summary */}
      {selectedSlot && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Price Summary</Text>
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
      )}

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bookButton, bookingMutation.isPending && styles.bookButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={bookingMutation.isPending}
        >
          {bookingMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>
              {selectedSlot ? `Book ${formatCurrency(total)}` : 'Select a Time Slot'}
            </Text>
          )}
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  consultantCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 8,
  },
  consultantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  consultantInfo: {
    marginLeft: 16,
  },
  consultantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  consultantVertical: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  consultantRate: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  slotCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    width: 140,
  },
  slotCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  slotDate: {
    fontSize: 12,
    color: '#64748b',
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 4,
  },
  slotPrice: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    padding: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
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
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  bookButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
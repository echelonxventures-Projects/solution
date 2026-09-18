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
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { api, apiClient } from '@lib/api'
import { formatCurrency, formatDate, formatTime } from '@lib/utils'
import { useAuthStore } from '@stores'

export default function DashboardScreen() {
  const navigation = useNavigation()
  const user = useAuthStore((state) => state.user)

  const { data: stats } = useQuery({
    queryKey: ['user', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me/stats')
      return response.data
    },
  })

  const { data: upcomingBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', 'upcoming'],
    queryFn: async () => {
      const response = await api.bookings.list({ status: 'confirmed', upcoming: true })
      return response.data.bookings || []
    },
  })

  const { data: pastBookings } = useQuery({
    queryKey: ['bookings', 'past'],
    queryFn: async () => {
      const response = await api.bookings.list({ status: 'completed', limit: 5 })
      return response.data.bookings || []
    },
  })

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.authPrompt}>
          <Ionicons name="person-outline" size={64} color="#94a3b8" />
          <Text style={styles.authPromptTitle}>Sign in to view your dashboard</Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user.firstName || user.name?.split(' ')[0]}</Text>
        <Text style={styles.subtitle}>Your consultation dashboard</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#2563eb" />
          <Text style={styles.statValue}>{stats?.totalSessions || 0}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#2563eb" />
          <Text style={styles.statValue}>{stats?.totalHours || 0}</Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="wallet" size={24} color="#2563eb" />
          <Text style={styles.statValue}>
            {formatCurrency(stats?.totalSpent || 0)}
          </Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
      </View>

      {/* Upcoming Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
        {bookingsLoading ? (
          <ActivityIndicator color="#2563eb" />
        ) : upcomingBookings?.length > 0 ? (
          upcomingBookings.map((booking: any) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => navigation.navigate('Session', { id: booking.id })}
            >
              <Image
                source={{ uri: booking.consultant?.avatar || 'https://via.placeholder.com/50' }}
                style={styles.bookingAvatar}
              />
              <View style={styles.bookingContent}>
                <Text style={styles.bookingConsultant}>
                  {booking.consultant?.name}
                </Text>
                <Text style={styles.bookingTime}>
                  {formatDate(booking.scheduledStart)}
                </Text>
                <Text style={styles.bookingDuration}>
                  {formatTime(booking.scheduledStart)} - {booking.durationMinutes} min
                </Text>
              </View>
              <TouchableOpacity
                style={styles.joinButton}
                onPress={() => navigation.navigate('Session', { id: booking.id })}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>No upcoming sessions</Text>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Text style={styles.searchButtonText}>Find a Consultant</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Past Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Past Sessions</Text>
        {pastBookings?.length > 0 ? (
          pastBookings.map((booking: any) => (
            <View key={booking.id} style={styles.bookingCard}>
              <Image
                source={{ uri: booking.consultant?.avatar || 'https://via.placeholder.com/50' }}
                style={styles.bookingAvatar}
              />
              <View style={styles.bookingContent}>
                <Text style={styles.bookingConsultant}>
                  {booking.consultant?.name}
                </Text>
                <Text style={styles.bookingTime}>
                  {formatDate(booking.scheduledStart)}
                </Text>
              </View>
              <Text style={styles.bookingAmount}>
                {formatCurrency(booking.totalAmount)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No past sessions</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authPromptTitle: {
    fontSize: 18,
    color: '#0f172a',
    marginTop: 16,
    textAlign: 'center',
  },
  authButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookingAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  bookingContent: {
    flex: 1,
    marginLeft: 12,
  },
  bookingConsultant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  bookingTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  bookingDuration: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 16,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 12,
  },
  searchButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
})
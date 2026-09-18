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
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@lib/api'
import { formatCurrency, formatDate, formatTime } from '@lib/utils'
import { useAuthStore } from '@stores'

export default function ConsultantDetailScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { id } = route.params as { id: string }
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const { data: consultant, isLoading } = useQuery({
    queryKey: ['consultant', id],
    queryFn: async () => {
      const response = await api.consultants.get(id)
      return response.data
    },
  })

  const { data: reviews } = useQuery({
    queryKey: ['consultant', id, 'reviews'],
    queryFn: async () => {
      const response = await api.consultants.reviews(id)
      return response.data.reviews || []
    },
  })

  const { data: availability } = useQuery({
    queryKey: ['consultant', id, 'availability'],
    queryFn: async () => {
      const response = await api.consultants.availability(id)
      return response.data.slots || []
    },
  })

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: consultant?.avatar || 'https://via.placeholder.com/120' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{consultant?.name}</Text>
        <Text style={styles.vertical}>{consultant?.vertical?.name}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color="#f59e0b" />
              <Text style={styles.statValue}>
                {consultant?.avgRating?.toFixed(1) || 'New'}
              </Text>
            </View>
            <Text style={styles.statLabel}>
              {consultant?.totalReviews || 0} reviews
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{consultant?.sessionsCompleted || 0}</Text>
            <Text style={styles.statLabel}>sessions</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {formatCurrency(consultant?.hourlyRate)}
            </Text>
            <Text style={styles.statLabel}>per hour</Text>
          </View>
        </View>

        {consultant?.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
            <Text style={styles.verifiedText}>Verified Expert</Text>
          </View>
        )}
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bioText}>{consultant?.bio}</Text>
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills & Expertise</Text>
        <View style={styles.skillsContainer}>
          {consultant?.skills?.map((skill: string) => (
            <View key={skill} style={styles.skillTag}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Slots</Text>
        {availability?.slice(0, 5).map((slot: any) => (
          <TouchableOpacity
            key={slot.id}
            style={styles.slotCard}
            onPress={() =>
              isAuthenticated
                ? navigation.navigate('Booking', { consultantId: id, slotId: slot.id })
                : navigation.navigate('Login')
            }
          >
            <View>
              <Text style={styles.slotDate}>{formatDate(slot.startTime)}</Text>
              <Text style={styles.slotTime}>
                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
              </Text>
            </View>
            <Text style={styles.slotPrice}>{formatCurrency(slot.price)}</Text>
          </TouchableOpacity>
        ))}
        {availability?.length === 0 && (
          <Text style={styles.emptyText}>No available slots</Text>
        )}
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews?.slice(0, 3).map((review: any) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAvatar}>
                <Text style={styles.reviewAvatarText}>
                  {review.seekerName?.charAt(0) || 'S'}
                </Text>
              </View>
              <View>
                <Text style={styles.reviewName}>{review.seekerName}</Text>
                <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
              </View>
              <View style={styles.reviewRating}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < review.rating ? 'star' : 'star-outline'}
                    size={14}
                    color="#f59e0b"
                  />
                ))}
              </View>
            </View>
            {review.comment && (
              <Text style={styles.reviewComment}>{review.comment}</Text>
            )}
          </View>
        ))}
        {reviews?.length === 0 && (
          <Text style={styles.emptyText}>No reviews yet</Text>
        )}
      </View>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() =>
            isAuthenticated
              ? navigation.navigate('Booking', { consultantId: id })
              : navigation.navigate('Login')
          }
        >
          <Text style={styles.bookButtonText}>
            {isAuthenticated ? 'Book a Session' : 'Log in to Book'}
          </Text>
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
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#2563eb',
  },
  profileSection: {
    backgroundColor: '#2563eb',
    padding: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  vertical: {
    fontSize: 16,
    color: '#dbeafe',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    width: '100%',
  },
  stat: {
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#dbeafe',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  verifiedText: {
    color: '#16a34a',
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 12,
  },
  skillText: {
    color: '#2563eb',
    fontSize: 14,
  },
  slotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  slotDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  slotTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  slotPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  reviewCard: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  reviewName: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  reviewDate: {
    marginLeft: 12,
    fontSize: 12,
    color: '#64748b',
  },
  reviewRating: {
    marginLeft: 'auto',
    flexDirection: 'row',
  },
  reviewComment: {
    marginTop: 8,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    padding: 16,
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
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
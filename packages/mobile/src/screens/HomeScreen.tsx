import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { api, apiClient } from '@lib/api'
import { formatCurrency } from '@lib/utils'

export default function HomeScreen() {
  const navigation = useNavigation()
  const [refreshing, setRefreshing] = React.useState(false)

  const { data: featuredConsultants, refetch } = useQuery({
    queryKey: ['consultants', 'featured'],
    queryFn: async () => {
      const response = await api.consultants.list({ featured: true, limit: 5 })
      return response.data.consultants || []
    },
  })

  const { data: verticals } = useQuery({
    queryKey: ['verticals'],
    queryFn: async () => {
      const response = await apiClient.get('/verticals')
      return response.data.verticals || []
    },
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Find Expert</Text>
          <Text style={styles.title}>Consultants</Text>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search')}
      >
        <Ionicons name="search-outline" size={20} color="#64748b" />
        <Text style={styles.searchPlaceholder}>
          Search consultants, skills, topics...
        </Text>
      </TouchableOpacity>

      {/* Featured Consultants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Experts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featuredConsultants?.map((consultant: any) => (
            <TouchableOpacity
              key={consultant.id}
              style={styles.consultantCard}
              onPress={() =>
                navigation.navigate('ConsultantDetail', { id: consultant.id })
              }
            >
              <Image
                source={{ uri: consultant.avatar || 'https://via.placeholder.com/100' }}
                style={styles.avatar}
              />
              <Text style={styles.consultantName} numberOfLines={1}>
                {consultant.name}
              </Text>
              <Text style={styles.consultantVertical} numberOfLines={1}>
                {consultant.vertical?.name}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text style={styles.rating}>
                  {consultant.avgRating?.toFixed(1) || 'New'}
                </Text>
              </View>
              <Text style={styles.price}>
                {formatCurrency(consultant.hourlyRate)}/hr
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Popular Verticals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Categories</Text>
        <View style={styles.verticalsGrid}>
          {verticals?.slice(0, 6).map((vertical: any) => (
            <TouchableOpacity
              key={vertical.id}
              style={styles.verticalCard}
              onPress={() =>
                navigation.navigate('Search', { vertical: vertical.id })
              }
            >
              <View style={styles.verticalIcon}>
                <Ionicons name={vertical.icon || 'briefcase'} size={24} color="#2563eb" />
              </View>
              <Text style={styles.verticalName} numberOfLines={1}>
                {vertical.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Search & Find</Text>
            <Text style={styles.stepDesc}>
              Find consultants in your area of interest
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Book Session</Text>
            <Text style={styles.stepDesc}>
              Choose a time and book your consultation
            </Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Connect</Text>
            <Text style={styles.stepDesc}>
              Join video session and get expert advice
            </Text>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchPlaceholder: {
    marginLeft: 12,
    color: '#64748b',
    fontSize: 16,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  consultantCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },
  consultantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  consultantVertical: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    marginLeft: 4,
    fontSize: 12,
    color: '#0f172a',
  },
  price: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 8,
  },
  verticalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  verticalCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  verticalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  verticalName: {
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  stepDesc: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
})
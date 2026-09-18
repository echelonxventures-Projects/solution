import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useSearchStore } from '@stores'
import { api } from '@lib/api'
import { formatCurrency } from '@lib/utils'

export default function SearchScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { query, setQuery, setResults, results, isLoading, setLoading } = useSearchStore()

  React.useEffect(() => {
    if (route.params?.vertical) {
      searchConsultants('', { vertical: route.params.vertical })
    }
  }, [route.params])

  const searchConsultants = async (searchQuery: string, filters?: any) => {
    setLoading(true)
    try {
      const response = await api.consultants.search(searchQuery, filters)
      setResults(response.data.consultants || [])
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (text: string) => {
    setQuery(text)
    if (text.length >= 2) {
      searchConsultants(text)
    }
  }

  const renderConsultant = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate('ConsultantDetail', { id: item.id })}
    >
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/80' }}
        style={styles.avatar}
      />
      <View style={styles.resultContent}>
        <Text style={styles.consultantName}>{item.name}</Text>
        <Text style={styles.consultantVertical}>{item.vertical?.name}</Text>
        <View style={styles.metaContainer}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.rating}>
              {item.avgRating?.toFixed(1) || 'New'}
            </Text>
            <Text style={styles.reviewCount}>
              ({item.totalReviews || 0})
            </Text>
          </View>
          <Text style={styles.price}>{formatCurrency(item.hourlyRate)}/hr</Text>
        </View>
        {item.isAvailableNow && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>Available Now</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search consultants..."
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={18} color="#2563eb" />
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Available Now', 'Top Rated', 'Low Price', 'Verified'].map((filter) => (
            <TouchableOpacity key={filter} style={styles.filterTag}>
              <Text style={styles.filterTagText}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderConsultant}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
        />
      ) : query.length >= 2 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyDesc}>
            Try different keywords or adjust filters
          </Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Search for consultants</Text>
          <Text style={styles.emptyDesc}>
            Enter skills, topics, or expertise areas
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginLeft: 16,
    padding: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 12,
  },
  filterText: {
    marginLeft: 4,
    color: '#2563eb',
    fontWeight: '500',
  },
  filterTag: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  filterTagText: {
    color: '#334155',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  },
  resultContent: {
    flex: 1,
    marginLeft: 16,
  },
  consultantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  consultantVertical: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  reviewCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#64748b',
  },
  price: {
    marginLeft: 'auto',
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  availableBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 4,
    padding: 4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  availableText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
})
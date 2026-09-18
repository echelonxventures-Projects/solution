import React, { useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@lib/api'
import { formatTime } from '@lib/utils'
import { useSessionStore } from '@stores'
import Toast from 'react-native-toast-message'

// Note: For production, use react-native-webrtc properly
// This is a placeholder for the session screen structure

export default function SessionScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { id } = route.params as { id: string }
  const {
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    setConnectionStatus,
    clearSession,
  } = useSessionStore()

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const response = await api.bookings.get(id)
      return response.data
    },
  })

  const { data: sessionInfo } = useQuery({
    queryKey: ['session', 'info', id],
    queryFn: async () => {
      const response = await api.sessions.get(id)
      return response.data
    },
    enabled: !!booking,
  })

  useEffect(() => {
    if (sessionInfo?.roomToken) {
      connectToSession()
    }
  }, [sessionInfo])

  const connectToSession = async () => {
    try {
      setConnectionStatus({ isConnecting: true })
      await api.sessions.join(id)
      setConnectionStatus({ isConnecting: false, isConnected: true })
      Toast.show({
        type: 'success',
        text1: 'Connected to session',
      })
    } catch (error) {
      setConnectionStatus({ isConnecting: false, isConnected: false })
      Toast.show({
        type: 'error',
        text1: 'Connection failed',
        text2: 'Please check your internet connection',
      })
    }
  }

  const endSession = async () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.sessions.end(id)
              clearSession()
              Toast.show({
                type: 'success',
                text1: 'Session ended',
              })
              navigation.goBack()
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Failed to end session',
              })
            }
          },
        },
      ]
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.consultantInfo}>
          <Text style={styles.consultantName}>
            {booking?.consultant?.name}
          </Text>
          <Text style={styles.consultantVertical}>
            {booking?.consultant?.vertical?.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.endButton} onPress={endSession}>
          <Ionicons name="call" size={24} color="#ef4444" />
          <Text style={styles.endButtonText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Video Area */}
      <View style={styles.videoContainer}>
        {/* Placeholder for remote video */}
        <View style={styles.remoteVideo}>
          <Ionicons name="videocam-outline" size={64} color="#94a3b8" />
          <Text style={styles.videoText}>
            {sessionInfo?.isConnected ? 'Connected' : 'Connecting...'}
          </Text>
        </View>

        {/* Local video overlay */}
        <View style={styles.localVideo}>
          <Ionicons name="person" size={32} color="#64748b" />
        </View>
      </View>

      {/* Connection Status */}
      <View style={styles.statusBar}>
        <View style={styles.statusIndicator}>
          <Ionicons
            name={sessionInfo?.isConnected ? 'wifi' : 'wifi-outline'}
            size={16}
            color={sessionInfo?.isConnected ? '#16a34a' : '#94a3b8'}
          />
          <Text style={styles.statusText}>
            {sessionInfo?.isConnected ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
        <Text style={styles.sessionTime}>
          Started at {formatTime(booking?.scheduledStart)}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={28}
            color={isMuted ? '#ef4444' : '#fff'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
          onPress={toggleVideo}
        >
          <Ionicons
            name={isVideoOff ? 'videocam-off' : 'videocam'}
            size={28}
            color={isVideoOff ? '#ef4444' : '#fff'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.chatButton}>
          <Ionicons name="chatbubble-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.fullScreenButton}>
          <Ionicons name="expand-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat Overlay (would toggle) */}
      <TouchableOpacity style={styles.chatToggle}>
        <Ionicons name="chatbubble-outline" size={24} color="#2563eb" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1e293b',
  },
  consultantInfo: {
    flex: 1,
  },
  consultantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  consultantVertical: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 8,
    paddingHorizontal: 16,
  },
  endButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  videoText: {
    color: '#94a3b8',
    marginTop: 16,
  },
  localVideo: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    width: 120,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#475569',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 8,
    color: '#94a3b8',
    fontSize: 14,
  },
  sessionTime: {
    color: '#94a3b8',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#1e293b',
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#ef4444',
  },
  chatButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatToggle: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 12,
  },
})
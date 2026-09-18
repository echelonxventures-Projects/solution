'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useParams } from 'next/navigation'
import { formatTime } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSessionStore } from '@/stores'

export default function SessionPage() {
  const params = useParams()
  const sessionId = params.id as string
  const [isConnecting, setIsConnecting] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', sessionId],
    queryFn: async () => {
      const response = await api.bookings.get(sessionId)
      return response.data
    },
  })

  const { data: sessionInfo } = useQuery({
    queryKey: ['session', 'info', sessionId],
    queryFn: async () => {
      const response = await api.sessions.get(sessionId)
      return response.data
    },
    enabled: !!booking,
  })

  // Initialize WebRTC connection
  useEffect(() => {
    if (!sessionInfo?.roomToken) return

    const signalingUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3004'}/signaling?token=${sessionInfo.roomToken}&roomId=${sessionId}`

    const ws = new WebSocket(signalingUrl)
    websocketRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      })
      peerConnectionRef.current = pc

      // Get local stream
      navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      }).then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Add tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream)
        })

        // Create and send offer
        pc.createOffer().then((offer) => {
          pc.setLocalDescription(offer)
          ws.send(JSON.stringify({
            type: 'offer',
            offer: offer.sdp,
          }))
        })
      }).catch((err) => {
        setError('Failed to access camera/microphone')
        setIsConnecting(false)
      })

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({
            type: 'ice_candidate',
            candidate: event.candidate.toJSON(),
          }))
        }
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
        setIsConnected(true)
        setIsConnecting(false)
      }
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const pc = peerConnectionRef.current

      if (!pc) return

      switch (data.type) {
        case 'answer':
          pc.setRemoteDescription({ type: 'answer', sdp: data.answer })
          break
        case 'ice_candidate':
          pc.addIceCandidate(data.candidate)
          break
        case 'chat':
          setChatMessages((prev) => [...prev, data.message])
          break
        case 'user_joined':
          // Handle user joined
          break
        case 'user_left':
          setIsConnected(false)
          setError('Other participant left the session')
          break
      }
    }

    ws.onerror = () => {
      setError('Connection error')
      setIsConnecting(false)
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    return () => {
      ws.close()
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (localVideoRef.current?.srcObject) {
        (localVideoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      }
    }
  }, [sessionInfo?.roomToken, sessionId])

  const sendMessage = () => {
    if (!chatInput.trim() || !websocketRef.current) return

    websocketRef.current.send(JSON.stringify({
      type: 'chat',
      message: {
        text: chatInput,
        timestamp: new Date().toISOString(),
      },
    }))

    setChatMessages((prev) => [...prev, {
      text: chatInput,
      timestamp: new Date().toISOString(),
      isOwn: true,
    }])
    setChatInput('')
  }

  const toggleMute = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      const audioTrack = stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const endSession = async () => {
    if (websocketRef.current) {
      websocketRef.current.close()
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    await api.sessions.end(sessionId)
  }

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
            Session not found
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-900">
      {/* Header */}
      <div className="bg-secondary-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={booking.consultant?.avatar || '/avatar-placeholder.png'}
            alt={booking.consultant?.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="text-white font-medium">
              {booking.consultant?.name}
            </div>
            <div className="text-secondary-400 text-sm">
              {booking.consultant?.vertical?.name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-white">
            {isConnected ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Connected
              </span>
            ) : (
              <span className="text-secondary-400">
                {isConnecting ? 'Connecting...' : 'Disconnected'}
              </span>
            )}
          </div>
          <div className="text-secondary-400">
            Session ID: {sessionId}
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Main Video */}
        <div className="flex-1 relative">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <p className="text-xl mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                  Retry Connection
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video (small) */}
              <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden shadow-lg border-2 border-secondary-700">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              {isConnecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary-900/80">
                  <div className="text-center text-white">
                    <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mb-4 mx-auto" />
                    <p>Connecting to session...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-secondary-800 flex flex-col">
          <div className="p-4 border-b border-secondary-700">
            <h3 className="text-white font-medium">Chat</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`${
                  msg.isOwn
                    ? 'bg-primary-600 ml-auto'
                    : 'bg-secondary-700'
                } rounded-lg p-3 max-w-[80%]`}
              >
                <p className="text-white text-sm">{msg.text}</p>
                <span className="text-secondary-300 text-xs mt-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-secondary-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="input bg-secondary-700 text-white placeholder-secondary-400 border-secondary-600 flex-1"
              />
              <button onClick={sendMessage} className="btn btn-primary">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-secondary-800 px-4 py-3 flex items-center justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${
            isMuted ? 'bg-red-600' : 'bg-secondary-700'
          } hover:opacity-80 transition`}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMuted ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-4a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            )}
          </svg>
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${
            isVideoOff ? 'bg-red-600' : 'bg-secondary-700'
          } hover:opacity-80 transition`}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isVideoOff ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z M3 3l18 18" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
          </svg>
        </button>

        <button
          onClick={endSession}
          className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition font-medium"
        >
          End Session
        </button>
      </div>
    </div>
  )
}
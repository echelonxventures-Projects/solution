# Communication Module - Real-time Connectivity

> **Document Version:** 1.0
> **Last Updated:** 2026-04-13
> **Owner:** Solution Architect
> **Related:** [CLAUDE.md](../CLAUDE.md) - Master Index

---

## 1. Communication Overview

This module handles all real-time communication: video calls, audio calls, live chat, WhatsApp integration, and notifications.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMMUNICATION ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│   │ VIDEO/AUDIO     │     │ LIVE CHAT       │     │ WHATSAPP        │      │
│   │ (WebRTC)        │     │ (WebSocket)     │     │ (Business API)  │      │
│   └───────┬─────────┘     └───────┬─────────┘     └───────┬─────────┘      │
│           │                       │                       │                │
│           └────────────────────────────────────────────────┘                │
│                                   │                                         │
│                                   ▼                                         │
│                   ┌───────────────────────────────────────┐                 │
│                   │        COMMUNICATION SERVICE          │                 │
│                   │  • Session Management                 │                 │
│                   │  • Media Routing                      │                 │
│                   │  • Recording & Transcription          │                 │
│                   │  • Translation Layer                  │                 │
│                   └───────────────────────────────────────┘                 │
│                                   │                                         │
│           ┌────────────────────────────────────────────────┬───────────────┐│
│           │                       │                       │               ││
│           ▼                       ▼                       ▼               ││
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│   │ NOTIFICATION    │     │ TRANSLATION     │     │ AI PROCESSING   │      │
│   │ SERVICE         │     │ SERVICE         │     │ (Chatbot/Copilot)│     │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Video/Audio Calling (WebRTC)

### 2.1 WebRTC Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WEBRTC INFRASTRUCTURE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                      MEDIA SERVERS (Mediasoup/TokBox)                 │ │
│   │                                                                       │ │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │ │
│   │  │ US-WEST Region  │  │ US-EAST Region  │  │ EU Region       │       │ │
│   │  │ Media Server    │  │ Media Server    │  │ Media Server    │       │ │
│   │  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤       │ │
│   │  │ • SFU (Selective│  │ • SFU           │  │ • SFU           │       │ │
│   │  │   Forwarding)   │  │ • Recording     │  │ • Recording     │       │ │
│   │  │ • Recording     │  │ • Transcoding   │  │ • Transcoding   │       │ │
│   │  │ • Transcoding   │  │                 │  │                 │       │ │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │ │
│   │                                                                       │ │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │ │
│   │  │ APAC Region     │  │ MEA Region      │  │ LATAM Region    │       │ │
│   │  │ Media Server    │  │ Media Server    │  │ Media Server    │       │ │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────┘       │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                      SIGNALING SERVER                                 │ │
│   │                                                                       │ │
│   │  • WebSocket server for WebRTC signaling                              │ │
│   │  • SDP exchange (Offer/Answer)                                        │ │
│   │  • ICE candidate exchange                                             │ │
│   │  • Room creation and management                                       │ │
│   │  • Participant join/leave handling                                    │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                      TURN/STUN SERVERS                                │ │
│   │                                                                       │ │
│   │  STUN (for public IP discovery):                                       │ │
│   │  • Global STUN servers for NAT traversal                              │ │
│   │                                                                       │ │
│   │  TURN (for relay when direct connection fails):                        │ │
│   │  • Regional TURN servers for fallback media relay                     │ │
│   │  • Authentication required                                             │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Session Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VIDEO SESSION FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ USER A INITIATES│                                                        │
│  │ (Consultant)    │                                                        │
│  └────────────┬────┘                                                        │
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        ROOM CREATION                                    ││
│  │                                                                         ││
│  │  • Create WebRTC room on nearest media server                           ││
│  │  • Generate room_id and access tokens                                   ││
│  │  • Configure room settings (video/audio quality, recording)             ││
│  │  • Store room metadata in database                                      ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        USER A JOIN                                      ││
│  │                                                                         ││
│  │  • Connect to WebSocket signaling server                                ││
│  │  • Exchange SDP offer                                                   ││
│  │  • Send ICE candidates                                                  ││
│  │  • Establish WebRTC connection                                          ││
│  │  • Publish video/audio tracks                                           ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        USER B JOINS (Seeker)                            ││
│  │                                                                         ││
│  │  • Receive join notification (WebSocket/Push)                           ││
│  │  • Connect to same room                                                 ││
│  │  • Exchange SDP answer                                                   ││
│  │  • Send ICE candidates                                                  ││
│  │  • Establish WebRTC connection                                          ││
│  │  • Subscribe to User A's tracks                                         ││
│  │  • Publish own tracks                                                    ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        SESSION ACTIVE                                   ││
│  │                                                                         ││
│  │  • Real-time video/audio streaming                                      ││
│  │  • Quality monitoring (bitrate, latency, packet loss)                   ││
│  │  • Dynamic quality adjustment                                           ││
│  │  • Recording (if enabled)                                               ││
│  │  • Chat messages exchange                                               ││
│  │  • AI Copilot processing (consultant side)                              ││
│  │  • Billing timer (if per-minute)                                        ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│               │                                                             │
│               ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        SESSION END                                      ││
│  │                                                                         ││
│  │  • Both users leave room                                                ││
│  │  • Close WebRTC connections                                             ││
│  │  • Stop recording                                                       ││
│  │  • Generate recording URL                                               ││
│  │  • Process transcription                                                ││
│  │  • Generate AI summary                                                  ││
│  │  • Final billing calculation                                            ││
│  │  • Trigger post-session events                                          ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Media Quality Configuration

```yaml
MediaQualityConfig:
  video:
    default_resolution: 720p
    max_resolution: 1080p
    min_resolution: 480p
    default_bitrate: 1500 kbps
    max_bitrate: 3000 kbps
    min_bitrate: 500 kbps
    frame_rate: 30 fps
    codec: H264/VP9
  
  audio:
    codec: Opus
    bitrate: 64 kbps
    max_bitrate: 128 kbps
    sample_rate: 48000 Hz
    channels: 2 (stereo)
    echo_cancellation: true
    noise_suppression: true
    auto_gain_control: true
  
  screen_share:
    max_resolution: 1080p
    max_bitrate: 5000 kbps
    frame_rate: 15 fps (adaptive)
  
  recording:
    format: MP4
    video_codec: H264
    audio_codec: AAC
    container: MP4
    resolution: 720p (default)
    include_chat: true
  
  adaptive_bitrate:
    enabled: true
    algorithm: congestion-based
    fallback_threshold: 80% packet_loss
    recovery_time: 5 seconds
```

---

## 3. Live Chat System

### 3.1 Chat Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LIVE CHAT ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                      SOCKET.IO / WEBSOCKET SERVER                     │ │
│   │                                                                       │ │
│   │  Features:                                                             │ │
│   │  • Real-time bidirectional communication                              │ │
│   │  • Room-based messaging (session-specific)                            │ │
│   │  • Message persistence                                                 │ │
│   │  • Typing indicators                                                   │ │
│   │  • Read receipts                                                       │ │
│   │  • Message reactions                                                   │ │
│   │  • File sharing                                                        │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                      MESSAGE STORAGE                                  │ │
│   │                                                                       │ │
│   │  MongoDB:                                                              │ │
│   │  • Message content and metadata                                        │ │
│   │  • Conversation threads                                                │ │
│   │  • Attachments                                                         │ │
│   │  • Searchable transcripts                                              │ │
│   │                                                                       │ │
│   │  Redis:                                                                │ │
│   │  • Active conversations                                                │ │
│   │  • Unread counts                                                       │ │
│   │  • Typing state                                                        │ │
│   │  • Online presence                                                     │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                      AI CHAT PROCESSING                                │ │
│   │                                                                       │ │
│   │  Real-time AI features:                                                │ │
│   │  • Intent detection                                                    │ │
│   │  • Sentiment analysis                                                  │ │
│   │  • Smart reply suggestions                                             │ │
│   │  • Auto-complete                                                       │ │
│   │  • Translation                                                         │ │
│   │  • Summarization                                                       │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Chat Message Schema

```yaml
ChatMessage:
  message_id: UUID
  conversation_id: UUID
  session_id: UUID (optional)
  
  sender:
    user_id: UUID
    user_type: enum[seeker, consultant, ai_bot, system]
    display_name: String
    avatar_url: String
  
  content:
    type: enum[text, image, file, audio, video, system, ai_suggestion]
    text: String
    media_url: String (optional)
    media_type: String (optional)
    media_size: Integer (optional)
    attachments: [URL]
  
  metadata:
    created_at: Timestamp
    edited_at: Timestamp (optional)
    deleted_at: Timestamp (optional)
    reply_to: UUID (optional)
    thread_id: UUID (optional)
    reactions: [{reaction, user_id, timestamp}]
    read_by: [{user_id, read_at}]
  
  ai_processing:
    intent: String
    entities: JSON
    sentiment: Decimal
    suggested_response: String
    translation: JSON {language: text}
    embedding: [Decimal]
  
  delivery:
    status: enum[sent, delivered, read, failed]
    delivered_at: Timestamp
    read_at: Timestamp
    channel: enum[platform, whatsapp, sms]
```

---

## 4. WhatsApp Business Integration

### 4.1 WhatsApp Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHATSAPP BUSINESS API INTEGRATION                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                      WHATSAPP BUSINESS API                             │ │
│   │                                                                       │ │
│   │  Meta Cloud API Integration:                                           │ │
│   │  • Business account management                                         │ │
│   │  • Phone number registration                                           │ │
│   │  • Message templates                                                   │ │
│   │  • Webhook for incoming messages                                       │ │
│   │  • Message delivery reports                                            │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                      MESSAGE TYPES                                     │ │
│   │                                                                       │ │
│   │  Supported message types:                                              │ │
│   │  • Text messages                                                       │ │
│   │  • Image/Video/Audio messages                                          │ │
│   │  • Document messages                                                   │ │
│   │  • Interactive buttons                                                 │ │
│   │  • List messages                                                       │ │
│   │  • Template messages                                                   │ │
│   │  • Location messages                                                   │ │
│   │  • Contact cards                                                       │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                      USE CASES                                         │ │
│   │                                                                       │ │
│   │  1. BOOKING NOTIFICATIONS                                              │ │
│   │     • Booking confirmation                                             │ │
│   │     • Reminder 24h before                                              │ │
│   │     • Reminder 1h before                                               │ │
│   │     • Session start link                                               │ │
│   │                                                                       │ │
│   │  2. CHATBOT INTERACTION                                                │ │
│   │     • Browse consultants                                                │ │
│   │     • Book appointment                                                 │ │
│   │     • Check availability                                               │ │
│   │     • Get recommendations                                              │ │
│   │                                                                       │ │
│   │  3. CONSULTANT COMMUNICATION                                           │ │
│   │     • Direct chat with consultant                                      │ │
│   │     • Follow-up messages                                               │ │
│   │     • Resource sharing                                                 │ │
│   │                                                                       │ │
│   │  4. PAYMENT NOTIFICATIONS                                              │ │
│   │     • Payment confirmation                                             │ │
│   │     • Invoice delivery                                                 │ │
│   │     • Refund notifications                                             │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 WhatsApp Bot Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHATSAPP CHATBOT FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User sends: "I want astrology consultation"                                │
│  │                                                                          │
│  ▼                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        INTENT DETECTION                                 ││
│  │                                                                         ││
│  │  NLP Processing:                                                        ││
│  │  • Intent: "book_consultation"                                          ││
│  │  • Vertical: "astrology"                                                ││
│  │  • Entities: []                                                         ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  │                                                                          │
│  ▼                                                                          │
│  Bot responds:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ "Great! I can help you book an astrology consultation.                   ││
│  │  Here are our top-rated astrologers:                                    ││
│  │                                                                         ││
│  │  1. Dr. Sharma - Vedic Astrology ⭐4.9                                  ││
│  │     📅 Available: Tomorrow 10 AM                                        ││
│  │     💰 $50/session                                                      ││
│  │                                                                         ││
│  │  2. Master Lee - Chinese Astrology ⭐4.8                               ││
│  │     📅 Available: Today 5 PM                                            ││
│  │     💰 $40/session                                                      ││
│  │                                                                         ││
│  │  Please select an option (1 or 2) or type 'more' for more options."     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  │                                                                          │
│  ▼                                                                          │
│  User sends: "1"                                                            │
│  │                                                                          │
│  ▼                                                                          │
│  Bot responds:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ "You've selected Dr. Sharma.                                            ││
│  │  Tomorrow 10 AM works great!                                            ││
│  │                                                                         ││
│  │  Please confirm your booking:                                           ││
│  │  [Confirm Booking]  [Change Time]  [Cancel]"                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  │                                                                          │
│  ▼                                                                          │
│  User clicks: [Confirm Booking]                                             │
│  │                                                                          │
│  ▼                                                                          │
│  Bot responds:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ "✅ Booking confirmed!                                                   ││
│  │                                                                         ││
│  │  📅 Tomorrow, 10:00 AM (IST)                                            ││
│  │  👤 Dr. Sharma - Vedic Astrology                                        ││
│  │  ⏱ Duration: 45 minutes                                                 ││
│  │  💰 Amount: $50                                                         ││
│  │                                                                         ││
│  │  [Pay Now]  [Pay Later]                                                 ││
│  │                                                                         ││
│  │  You'll receive a reminder 1 hour before your session.                  ││
│  │  Session link will be shared before the start time."                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Notification System

### 5.1 Notification Channels

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION CHANNELS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┬─────────────────────────────────────────────────────┐  │
│  │ Channel         │ Use Cases                                         │  │
│  ├─────────────────┼─────────────────────────────────────────────────────┤  │
│  │                 │                                                   │  │
│  │ EMAIL           │ • Booking confirmations                           │  │
│  │ (SendGrid/SES)  │ • Payment receipts                                │  │
│  │                 │ • Weekly reports                                  │  │
│  │                 │ • Marketing newsletters                            │  │
│  │                 │ • Account alerts                                  │  │
│  │                 │                                                   │  │
│  │ SMS             │ • OTP verification                                │  │
│  │ (Twilio)        │ • Urgent reminders                                │  │
│  │                 │ • Session alerts                                  │  │
│  │                 │ • Payment notifications                            │  │
│  │                 │                                                   │  │
│  │ PUSH            │ • Real-time updates                               │  │
│  │ (Firebase/FCM)  │ • New messages                                    │  │
│  │                 │ • Session reminders                               │  │
│  │                 │ • Promotional offers                              │  │
│  │                 │                                                   │  │
│  │ WHATSAPP        │ • Session links                                   │  │
│  │                 │ • Booking reminders                               │  │
│  │                 │ • Follow-up messages                              │  │
│  │                 │ • Chatbot interactions                            │  │
│  │                 │                                                   │  │
│  │ IN-APP          │ • Live notifications                              │  │
│  │ (WebSocket)     │ • Real-time status updates                        │  │
│  │                 │ • Activity alerts                                 │  │
│  │                 │                                                   │  │
│  └─────────────────┴─────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Notification Templates

```yaml
NotificationTemplates:
  
  BookingConfirmation:
    email:
      subject: "Booking Confirmed with {consultant_name}"
      body: |
        Hi {user_name},
        
        Your booking has been confirmed:
        
        📅 Date: {date}
        🕐 Time: {time} ({timezone})
        👤 Consultant: {consultant_name}
        📂 Topic: {vertical_name}
        ⏱ Duration: {duration} minutes
        💰 Amount: {amount} {currency}
        
        Session link will be sent 30 minutes before start.
        
        [View Booking] [Cancel]
        
    whatsapp:
      template: "booking_confirmation"
      params: [date, time, consultant_name, amount]
  
  SessionReminder:
    push:
      title: "Session starting soon!"
      body: "Your session with {consultant_name} starts in {minutes} minutes"
      action: "JOIN_SESSION"
    
    whatsapp:
      template: "session_reminder"
      params: [consultant_name, minutes, session_link]
  
  PaymentSuccess:
    email:
      subject: "Payment Successful - Invoice #{invoice_number}"
      body: |
        Hi {user_name},
        
        Payment of {amount} {currency} has been processed.
        
        Invoice: #{invoice_number}
        Date: {date}
        
        [Download Invoice]
```

---

## 6. Translation Services

### 6.1 Translation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME TRANSLATION                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      TRANSLATION PROVIDERS                             │ │
│  │                                                                       │ │
│  │  Primary: DeepL API                                                     │
│  │  • High-quality translations                                            │
│  │  • Context-aware                                                        │
│  │  • Supports 30+ languages                                               │
│  │                                                                       │ │
│  │  Secondary: Google Translate API                                        │
│  │  • Fallback for unsupported languages                                   │
│  │  • Broader language coverage                                            │
│  │                                                                       │ │
│  │  Real-time Speech: Whisper + ElevenLabs                                 │
│  │  • Transcribe speech                                                    │ │
│  │  • Translate text                                                       │ │
│  │  • Generate speech in target language                                   │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                      USE CASES                                         │ │
│  │                                                                       │ │
│  │  1. CHAT TRANSLATION                                                    │ │
│  │     • User sends in language A                                          │ │
│  │     • Recipient sees in language B                                      │ │
│  │     • Both see original + translated                                    │ │
│  │                                                                       │ │
│  │  2. VIDEO CALL TRANSLATION                                              │ │
│  │     • Real-time subtitle overlay                                        │ │
│  │     • Speech-to-speech translation                                      │ │
│  │     • Transcript in both languages                                      │ │
│  │                                                                       │ │
│  │  3. CONTENT TRANSLATION                                                 │ │
│  │     • Class subtitles                                                   │ │
│  │     • Description localization                                          │ │
│  │     • AI summary translation                                            │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. See [Session Entity in Domain Models](../architecture/domain-models.md#25-session-entity)
2. Review [Message Entity in Domain Models](../architecture/domain-models.md#210-message-entity)
3. Check [Service Architecture](../architecture/service-architecture.md) for Communication Service

---

**Return to:** [CLAUDE.md](../CLAUDE.md) - Master Architecture Index
// WhatsApp Bot Service - AI-powered chatbot
// Handles: webhook verification, message processing, AI responses
import express, { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'

const app = express()
app.use(express.json())

// WhatsApp Webhook Verification
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string
  const token = req.query['hub.verify_token'] as string
  const challenge = req.query['hub.challenge'] as string

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'consultancy_verify_token'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED')
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
})

// WhatsApp Message Handler
app.post('/webhook',
  [
    body('entry').isArray(),
    body('entry.*.changes').isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const body = req.body ?? {}
      const entry = body.entry?.[0]
      const change = entry?.changes?.[0]
      const value = change?.value

      if (value?.messages) {
        for (const message of value.messages) {
          await handleMessage(message, value.metadata.phone_number_id)
        }
      }

      res.status(200).send('OK')
    } catch (error) {
      console.error('Error processing webhook:', error)
      res.status(500).send('Error')
    }
  }
)

// Message Handler
async function handleMessage(message: any, phoneNumberId: string) {
  const from = message.from
  const messageId = message.id
  const _timestamp = new Date(parseInt(message.timestamp) * 1000)

  // Mark message as read
  await markMessageAsRead(messageId, phoneNumberId)

  // Handle different message types
  switch (message.type) {
    case 'text':
      await handleTextMessage(message.text.body, from, phoneNumberId)
      break
    case 'interactive':
      await handleInteractiveMessage(message.interactive, from, phoneNumberId)
      break
    case 'image':
      await handleMediaMessage(message.image, from, phoneNumberId, 'image')
      break
    case 'video':
      await handleMediaMessage(message.video, from, phoneNumberId, 'video')
      break
    case 'document':
      await handleMediaMessage(message.document, from, phoneNumberId, 'document')
      break
    case 'location':
      await handleLocationMessage(message.location, from, phoneNumberId)
      break
    case 'contacts':
      await handleContactsMessage(message.contacts, from, phoneNumberId)
      break
    default:
      await sendMessage(from, phoneNumberId, 'Sorry, I don\'t understand that message type.')
  }
}

// Text Message Handler
async function handleTextMessage(text: string, from: string, phoneNumberId: string) {
  const lowerText = text.toLowerCase().trim()

  // Intent Detection
  if (lowerText.includes('book') || lowerText.includes('appointment') || lowerText.includes('session')) {
    await handleBookingIntent(from, phoneNumberId, text)
  } else if (lowerText.includes('search') || lowerText.includes('find') || lowerText.includes('consultant')) {
    await handleSearchIntent(from, phoneNumberId, text)
  } else if (lowerText.includes('help') || lowerText.includes('support')) {
    await sendHelpMenu(from, phoneNumberId)
  } else if (lowerText.includes('status') || lowerText.includes('booking')) {
    await handleStatusIntent(from, phoneNumberId)
  } else if (lowerText.includes('cancel')) {
    await handleCancelIntent(from, phoneNumberId)
  } else if (lowerText.match(/\d+/)) {
    // User selecting a option
    await handleOptionSelection(from, phoneNumberId, parseInt(lowerText))
  } else {
    // Default response with menu
    await sendMainMenu(from, phoneNumberId)
  }
}

// Send Main Menu
async function sendMainMenu(to: string, phoneNumberId: string) {
  const messageData = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: 'Welcome to Consultancy Platform! 👋\n\nHow can I help you today?',
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'search_consultant',
              title: 'Find Consultant',
            },
          },
          {
            type: 'reply',
            reply: {
              id: 'book_session',
              title: 'Book Session',
            },
          },
          {
            type: 'reply',
            reply: {
              id: 'my_bookings',
              title: 'My Bookings',
            },
          },
          {
            type: 'reply',
            reply: {
              id: 'help',
              title: 'Help',
            },
          },
        ],
      },
    },
  }

  await sendWhatsAppMessage(phoneNumberId, messageData)
}

// Send Help Menu
async function sendHelpMenu(to: string, phoneNumberId: string) {
  const helpText = `📚 *Help Guide*

*Commands:*
• "find [topic]" - Search consultants
• "book [consultant]" - Book a session
• "status" - Check your bookings
• "cancel [booking_id]" - Cancel a booking

*Example:*
"find React developer"
"book John Doe"

Need more help? Contact our support team at support@consultancy.com`

  await sendMessage(to, phoneNumberId, helpText)
}

// Handle Search Intent
async function handleSearchIntent(from: string, phoneNumberId: string, text: string) {
  // Extract search query
  const query = text.replace(/search|find|consultant/gi, '').trim()

  if (!query) {
    // Ask for category
    const categories = ['Technology', 'Business', 'Health', 'Legal', 'Finance', 'Education']

    const messageData = {
      messaging_product: 'whatsapp',
      to: from,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: 'Select Category',
        },
        body: {
          text: 'Choose a category to find consultants:',
        },
        action: {
          button: 'Select',
          sections: [{
            title: 'Categories',
            rows: categories.map((cat) => ({
              id: `category_${cat.toLowerCase()}`,
              title: cat,
              description: `Find ${cat} consultants`,
            })),
          }],
        },
      },
    }

    await sendWhatsAppMessage(phoneNumberId, messageData)
    return
  }

  // Perform actual search (would call consultant-service API)
  const results = await searchConsultants(query)

  if (results.length === 0) {
    await sendMessage(from, phoneNumberId, `No consultants found for "${query}". Try a different search term.`)
    return
  }

  // Display results
  const resultsText = formatConsultantResults(results)
  await sendMessage(from, phoneNumberId, resultsText)
}

// Handle Booking Intent
async function handleBookingIntent(from: string, phoneNumberId: string, text: string) {
  // Check if user is registered
  const user = await getUserByPhone(from)

  if (!user) {
    await sendMessage(from, phoneNumberId,
      'To book a session, you need to register first.\n\nVisit: https://consultancy.com/auth/register\n\nOr reply with your email to register.')
    return
  }

  // Parse consultant name/ID
  const consultantMatch = text.match(/book\s+(.+)/i)

  if (!consultantMatch) {
    await sendMessage(from, phoneNumberId,
      'Which consultant would you like to book?\n\nReply with:\n"book [consultant name]"')
    return
  }

  const consultantName = consultantMatch[1].trim()
  const consultant = await findConsultantByName(consultantName)

  if (!consultant) {
    await sendMessage(from, phoneNumberId,
      `Consultant "${consultantName}" not found. Try searching first: "find ${consultantName}"`)
    return
  }

  // Get availability
  const slots = await getConsultantAvailability(consultant.id)

  if (slots.length === 0) {
    await sendMessage(from, phoneNumberId,
      `${consultant.name} has no available slots. Check back later or try another consultant.`)
    return
  }

  // Send availability options
  const availabilityText = formatAvailabilityOptions(consultant, slots)
  await sendMessage(from, phoneNumberId, availabilityText)
}

// Handle Status Intent
async function handleStatusIntent(from: string, phoneNumberId: string) {
  const user = await getUserByPhone(from)

  if (!user) {
    await sendMessage(from, phoneNumberId, 'Please register to check your bookings.')
    return
  }

  const bookings = await getUserBookings(user.id)

  if (bookings.length === 0) {
    await sendMessage(from, phoneNumberId, 'You have no bookings.')
    return
  }

  const bookingsText = formatBookingsList(bookings)
  await sendMessage(from, phoneNumberId, bookingsText)
}

// Handle Interactive Message (Button/List response)
async function handleInteractiveMessage(interactive: any, from: string, phoneNumberId: string) {
  if (interactive.type === 'button_reply') {
    const buttonId = interactive.button_reply.id

    switch (buttonId) {
      case 'search_consultant':
        await handleSearchIntent(from, phoneNumberId, '')
        break
      case 'book_session':
        await sendMessage(from, phoneNumberId, 'Which consultant would you like to book?\n\nReply with: "book [name]"')
        break
      case 'my_bookings':
        await handleStatusIntent(from, phoneNumberId)
        break
      case 'help':
        await sendHelpMenu(from, phoneNumberId)
        break
      default:
        await sendMainMenu(from, phoneNumberId)
    }
  } else if (interactive.type === 'list_reply') {
    const listId = interactive.list_reply.id

    if (listId.startsWith('category_')) {
      const category = listId.replace('category_', '')
      await handleSearchIntent(from, phoneNumberId, category)
    } else if (listId.startsWith('slot_')) {
      const slotId = listId.replace('slot_', '')
      await handleSlotSelection(from, phoneNumberId, slotId)
    }
  }
}

// Handle Slot Selection
async function handleSlotSelection(from: string, phoneNumberId: string, slotId: string) {
  const user = await getUserByPhone(from)

  if (!user) {
    await sendMessage(from, phoneNumberId, 'Please register first.')
    return
  }

  // Create booking
  const booking = await createBooking({
    userId: user.id,
    slotId: slotId,
  })

  // Payment link
  const paymentUrl = `https://consultancy.com/payment?bookingId=${booking.id}`

  await sendMessage(from, phoneNumberId,
    `✅ Booking created!\n\n*Consultant:* ${booking.consultant.name}\n*Time:* ${booking.time}\n\nComplete payment here:\n${paymentUrl}`)
}

// Handle Media Message (image/video/document)
async function handleMediaMessage(media: any, from: string, phoneNumberId: string, mediaType: string) {
  const caption = media.caption ? `\nCaption: ${media.caption}` : ''
  await sendMessage(from, phoneNumberId,
    `📎 Received your ${mediaType}.${caption}\n\nFor consultation-related files, our team will review it during your session. Anything else? Reply "help" for options.`)
}

// Handle Location Message
async function handleLocationMessage(location: any, from: string, phoneNumberId: string) {
  const lat = typeof location.latitude === 'number' ? location.latitude.toFixed(4) : location.latitude
  const lng = typeof location.longitude === 'number' ? location.longitude.toFixed(4) : location.longitude
  await sendMessage(from, phoneNumberId,
    `📍 Thanks for sharing your location (${lat}, ${lng}).\n\nI can help you find consultants near you. Reply "search" to browse available consultants.`)
}

// Handle Contacts Message
async function handleContactsMessage(contacts: any, from: string, phoneNumberId: string) {
  const contact = Array.isArray(contacts) ? contacts[0] : contacts
  const name = contact?.name?.formatted_name || contact?.profile?.name || 'your contact'
  await sendMessage(from, phoneNumberId,
    `👤 Received contact: ${name}.\n\nIf you'd like to book a session for them too, ask them to message us at the same number. Anything else? Reply "help".`)
}

// Handle Cancel Intent
async function handleCancelIntent(from: string, phoneNumberId: string) {
  const user = await getUserByPhone(from)

  if (!user) {
    await sendMessage(from, phoneNumberId, 'Please register first.')
    return
  }

  const bookings = await getUserBookings(user.id)
  const upcoming = bookings.filter((b: any) => b.status === 'pending' || b.status === 'confirmed')

  if (upcoming.length === 0) {
    await sendMessage(from, phoneNumberId, 'You have no upcoming bookings to cancel. Reply "help" for options.')
    return
  }

  const lines = upcoming.map((b: any, i: number) =>
    `${i + 1}. ${b.consultant?.name || 'Consultant'} - ${formatDate(b.scheduledStart)} ${formatTime(b.scheduledStart)}`)

  await sendMessage(from, phoneNumberId,
    `To cancel, reply with the booking number:\n\n${lines.join('\n')}\n\n(Use "cancel <number>")`)
}

// Handle Option Selection (numeric reply from a menu)
async function handleOptionSelection(from: string, phoneNumberId: string, option: number) {
  switch (option) {
    case 1:
      await handleSearchIntent(from, phoneNumberId, '')
      break
    case 2:
      await handleBookingIntent(from, phoneNumberId, '')
      break
    case 3:
      await handleStatusIntent(from, phoneNumberId)
      break
    case 4:
      await sendHelpMenu(from, phoneNumberId)
      break
    default:
      await sendMainMenu(from, phoneNumberId)
  }
}

// Send WhatsApp Message
async function sendWhatsAppMessage(phoneNumberId: string, messageData: any) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_BUSINESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    }
  )

  return response.json()
}

// Send Simple Text Message
async function sendMessage(to: string, phoneNumberId: string, text: string) {
  const messageData = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'text',
    text: {
      body: text,
    },
  }

  await sendWhatsAppMessage(phoneNumberId, messageData)
}

// Mark Message as Read
async function markMessageAsRead(messageId: string, phoneNumberId: string) {
  const messageData = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  }

  await sendWhatsAppMessage(phoneNumberId, messageData)
}

// Helper functions (would integrate with actual services)
async function searchConsultants(_query: string): Promise<any[]> {
  // Call consultant-service API
  return []
}

async function getUserByPhone(_phone: string): Promise<any | null> {
  // Call user-service API
  return null
}

async function findConsultantByName(_name: string): Promise<any | null> {
  // Call consultant-service API
  return null
}

async function getConsultantAvailability(_consultantId: string): Promise<any[]> {
  // Call booking-service API
  return []
}

async function getUserBookings(_userId: string): Promise<any[]> {
  // Call booking-service API
  return []
}

async function createBooking(_data: any): Promise<any> {
  // Call booking-service API
  return {}
}

// Formatting helpers
function formatConsultantResults(consultants: any[]): string {
  let text = '📋 *Consultants Found*\n\n'

  consultants.forEach((c, i) => {
    text += `${i + 1}. *${c.name}*\n`
    text += `   ${c.vertical}\n`
    text += `   ⭐ ${c.rating} | $${c.rate}/hr\n`
    text += `   ${c.bio.substring(0, 50)}...\n\n`
  })

  text += 'Reply with "book [number]" to book a session.'

  return text
}

function formatAvailabilityOptions(consultant: any, slots: any[]): string {
  let text = `📅 *${consultant.name} - Available Slots*\n\n`

  slots.forEach((slot, i) => {
    text += `${i + 1}. ${formatDate(slot.startTime)} at ${formatTime(slot.startTime)}\n`
    text += `   💰 $${slot.price}\n\n`
  })

  text += 'Reply with the slot number to book.'

  return text
}

function formatBookingsList(bookings: any[]): string {
  let text = '📅 *Your Bookings*\n\n'

  bookings.forEach((b) => {
    text += `• ${b.consultant.name}\n`
    text += `  ${formatDate(b.scheduledStart)}\n`
    text += `  Status: ${b.status}\n\n`
  })

  return text
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3015
app.listen(PORT, () => {
  console.log(`WhatsApp Bot service running on port ${PORT}`)
})

export default app
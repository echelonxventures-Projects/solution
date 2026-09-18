import { setupTestContext, cleanupTestContext, TestContext } from './setup'

describe('Authentication API', () => {
  let context: TestContext

  beforeAll(async () => {
    context = await setupTestContext()
  })

  afterAll(async () => {
    await cleanupTestContext(context)
  })

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const timestamp = Date.now()
      const response = await context.apiClient.post('/auth/register', {
        email: `test${timestamp}@example.com`,
        password: 'password123',
        name: 'Test User',
        role: 'seeker',
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('token')
      expect(response.data).toHaveProperty('user')
      expect(response.data.user.email).toBe(`test${timestamp}@example.com`)
    })

    it('should reject duplicate email', async () => {
      try {
        await context.apiClient.post('/auth/register', {
          email: process.env.TEST_USER_EMAIL || 'test@example.com',
          password: 'password123',
          name: 'Duplicate User',
          role: 'seeker',
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error).toContain('already exists')
      }
    })

    it('should validate password strength', async () => {
      try {
        await context.apiClient.post('/auth/register', {
          email: 'weak@test.com',
          password: 'weak',
          name: 'Weak Password',
          role: 'seeker',
        })
      } catch (error: any) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error).toContain('Password')
      }
    })
  })

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await context.apiClient.post('/auth/login', {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'password123',
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('token')
      expect(response.data).toHaveProperty('user')
    })

    it('should reject invalid credentials', async () => {
      try {
        await context.apiClient.post('/auth/login', {
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
      } catch (error: any) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.error).toContain('Invalid')
      }
    })

    it('should return user profile', async () => {
      const response = await context.apiClient.get('/auth/me')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('email')
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await context.apiClient.post('/auth/logout')

      expect(response.status).toBe(200)
    })
  })

  describe('POST /auth/refresh', () => {
    it('should refresh token', async () => {
      const response = await context.apiClient.post('/auth/refresh')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('token')
    })
  })
})

describe('User API', () => {
  let context: TestContext

  beforeAll(async () => {
    context = await setupTestContext()
  })

  afterAll(async () => {
    await cleanupTestContext(context)
  })

  describe('GET /users/me', () => {
    it('should return current user profile', async () => {
      const response = await context.apiClient.get('/users/me')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', context.userId)
      expect(response.data).toHaveProperty('email')
    })
  })

  describe('PUT /users/me', () => {
    it('should update user profile', async () => {
      const response = await context.apiClient.put('/users/me', {
        firstName: 'Updated',
        lastName: 'User',
        bio: 'Updated bio',
      })

      expect(response.status).toBe(200)
      expect(response.data.firstName).toBe('Updated')
    })
  })
})

describe('Consultant API', () => {
  let context: TestContext

  beforeAll(async () => {
    context = await setupTestContext()
  })

  afterAll(async () => {
    await cleanupTestContext(context)
  })

  describe('GET /consultants', () => {
    it('should list consultants', async () => {
      const response = await context.apiClient.get('/consultants', {
        params: { limit: 10 },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('consultants')
      expect(Array.isArray(response.data.consultants)).toBe(true)
    })

    it('should filter by vertical', async () => {
      const response = await context.apiClient.get('/consultants', {
        params: { vertical: 'technology' },
      })

      expect(response.status).toBe(200)
      expect(response.data.consultants.length).toBeGreaterThan(0)
    })
  })

  describe('GET /consultants/:id', () => {
    it('should return consultant details', async () => {
      const response = await context.apiClient.get(`/consultants/${context.consultantId}`)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', context.consultantId)
      expect(response.data).toHaveProperty('name')
      expect(response.data).toHaveProperty('hourlyRate')
    })

    it('should return 404 for invalid ID', async () => {
      try {
        await context.apiClient.get('/consultants/invalid-id')
      } catch (error: any) {
        expect(error.response.status).toBe(404)
      }
    })
  })

  describe('GET /consultants/:id/availability', () => {
    it('should return availability slots', async () => {
      const response = await context.apiClient.get(
        `/consultants/${context.consultantId}/availability`,
        { params: { date: new Date().toISOString().split('T')[0] } }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('slots')
    })
  })

  describe('GET /consultants/:id/reviews', () => {
    it('should return consultant reviews', async () => {
      const response = await context.apiClient.get(
        `/consultants/${context.consultantId}/reviews`
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('reviews')
    })
  })

  describe('GET /consultants/search', () => {
    it('should search consultants', async () => {
      const response = await context.apiClient.get('/consultants/search', {
        params: { q: 'developer' },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('consultants')
    })
  })
})

describe('Booking API', () => {
  let context: TestContext
  let bookingId: string

  beforeAll(async () => {
    context = await setupTestContext()
  })

  afterAll(async () => {
    // Cleanup booking
    if (bookingId) {
      try {
        await context.apiClient.post(`/bookings/${bookingId}/cancel`, {
          reason: 'Test cleanup',
        })
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    await cleanupTestContext(context)
  })

  describe('POST /bookings', () => {
    it('should create a booking', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)

      const response = await context.apiClient.post('/bookings', {
        consultantId: context.consultantId,
        scheduledStart: tomorrow.toISOString(),
        durationMinutes: 60,
        notes: 'Test booking',
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data.status).toBe('pending')

      bookingId = response.data.id
    })

    it('should reject overlapping booking', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)

      try {
        await context.apiClient.post('/bookings', {
          consultantId: context.consultantId,
          scheduledStart: tomorrow.toISOString(),
          durationMinutes: 60,
        })
      } catch (error: any) {
        expect(error.response.status).toBe(409)
        expect(error.response.data.error).toContain('conflict')
      }
    })
  })

  describe('GET /bookings', () => {
    it('should list user bookings', async () => {
      const response = await context.apiClient.get('/bookings')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('bookings')
    })
  })

  describe('GET /bookings/:id', () => {
    it('should return booking details', async () => {
      if (!bookingId) return

      const response = await context.apiClient.get(`/bookings/${bookingId}`)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', bookingId)
    })
  })

  describe('POST /bookings/:id/cancel', () => {
    it('should cancel booking', async () => {
      if (!bookingId) return

      const response = await context.apiClient.post(`/bookings/${bookingId}/cancel`, {
        reason: 'Test cancellation',
      })

      expect(response.status).toBe(200)
      expect(response.data.status).toBe('cancelled')
    })
  })
})

describe('Session API', () => {
  let context: TestContext

  beforeAll(async () => {
    context = await setupTestContext()
  })

  afterAll(async () => {
    await cleanupTestContext(context)
  })

  describe('GET /sessions/:id', () => {
    it('should return session details', async () => {
      const response = await context.apiClient.get('/sessions/test-session-id')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('roomId')
      expect(response.data).toHaveProperty('roomToken')
    })
  })

  describe('POST /sessions/:id/join', () => {
    it('should join session', async () => {
      const response = await context.apiClient.post('/sessions/test-session-id/join')

      expect(response.status).toBe(200)
    })
  })
})

describe('Payment API', () => {
  let context: TestContext

  beforeAll(async () => {
    context = await setupTestContext()
  })

  afterAll(async () => {
    await cleanupTestContext(context)
  })

  describe('POST /payments/stripe/intent', () => {
    it('should create Stripe payment intent', async () => {
      const response = await context.apiClient.post('/payments/stripe/intent', {
        bookingId: 'test-booking-id',
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('clientSecret')
    })
  })

  describe('POST /payments/paypal/order', () => {
    it('should create PayPal order', async () => {
      const response = await context.apiClient.post('/payments/paypal/order', {
        bookingId: 'test-booking-id',
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('orderId')
    })
  })
})

describe('Review API', () => {
  let context: TestContext
  let reviewId: string

  beforeAll(async () => {
    context = await setupTestContext()
  })

  afterAll(async () => {
    // Cleanup review
    if (reviewId) {
      try {
        await context.apiClient.delete(`/reviews/${reviewId}`)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    await cleanupTestContext(context)
  })

  describe('POST /reviews', () => {
    it('should create a review', async () => {
      const response = await context.apiClient.post('/reviews', {
        consultantId: context.consultantId,
        sessionId: 'test-session-id',
        rating: 5,
        comment: 'Excellent session!',
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data.rating).toBe(5)

      reviewId = response.data.id
    })
  })

  describe('GET /reviews', () => {
    it('should list reviews', async () => {
      const response = await context.apiClient.get('/reviews', {
        params: { consultantId: context.consultantId },
      })

      expect(response.status).toBe(200)
    })
  })
})
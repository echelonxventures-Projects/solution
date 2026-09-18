import axios, { AxiosInstance } from 'axios'

const API_URL = process.env.API_URL || 'http://localhost:8000'

export interface TestContext {
  apiClient: AxiosInstance
  authToken: string
  userId: string
  consultantId: string
}

export async function setupTestContext(): Promise<TestContext> {
  const apiClient = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
  })

  // Login to get auth token
  const loginResponse = await apiClient.post('/auth/login', {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'password123',
  })

  const authToken = loginResponse.data.accessToken || loginResponse.data.token
  const userId = loginResponse.data.user.id

  apiClient.defaults.headers.Authorization = `Bearer ${authToken}`

  // Get or create test consultant
  const consultantsResponse = await apiClient.get('/consultants', {
    params: { limit: 1 },
  })

  const consultantId = consultantsResponse.data.consultants[0]?.id || 'test-consultant-id'

  return {
    apiClient,
    authToken,
    userId,
    consultantId,
  }
}

export async function cleanupTestContext(context: TestContext): Promise<void> {
  // Cleanup any test data created
  try {
    await context.apiClient.post('/auth/logout')
  } catch (error) {
    // Ignore cleanup errors
  }
}
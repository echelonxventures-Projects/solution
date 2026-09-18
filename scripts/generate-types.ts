/**
 * Type generation script
 * Generates OpenAPI spec stub from route definitions for API clients
 *
 * Usage: npm run generate:types
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const OUT_DIR = join(__dirname, '..', 'generated')

interface Spec {
  openapi: string
  info: { title: string; version: string; description: string }
  servers: { url: string; description: string }[]
  paths: Record<string, Record<string, unknown>>
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const spec: Spec = {
    openapi: '3.0.3',
    info: {
      title: 'Consultancy Platform API',
      version: '1.0.0',
      description: 'Generated stub. Each service exposes its own Swagger UI at /docs.',
    },
    servers: [
      { url: 'http://localhost:8000', description: 'API Gateway (local)' },
      { url: 'http://localhost:3001', description: 'User Service (direct)' },
      { url: 'http://localhost:3002', description: 'Consultant Service (direct)' },
      { url: 'http://localhost:3003', description: 'Booking Service (direct)' },
      { url: 'http://localhost:3005', description: 'Billing Service (direct)' },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Service health check',
          responses: { '200': { description: 'Service is healthy' } },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Returns access token, refresh token, and user',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                      expiresIn: { type: 'number' },
                      user: { type: 'object' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/bookings': {
        get: {
          summary: 'List bookings',
          responses: { '200': { description: 'List of bookings' } },
        },
        post: {
          summary: 'Create a booking',
          responses: { '201': { description: 'Booking created' } },
        },
      },
      '/consultants': {
        get: {
          summary: 'List consultants',
          responses: { '200': { description: 'List of consultants' } },
        },
      },
    },
  }

  const outPath = join(OUT_DIR, 'openapi.json')
  writeFileSync(outPath, JSON.stringify(spec, null, 2))
  console.log(`Generated ${outPath}`)
}

main()

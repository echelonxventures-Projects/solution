/**
 * Database seeding script
 * Creates demo users, consultants, and sample data for development
 *
 * Usage: npm run db:seed
 */
import { Client } from 'pg'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

async function main() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    database: process.env.DATABASE_NAME || 'consultancy',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  })

  await client.connect()
  console.log('Connected to database')

  const existing = await client.query('SELECT COUNT(*) as count FROM users')
  if (existing.rows[0].count > 0) {
    console.log('Database already has users. Skipping seed. (Drop the DB to reseed.)')
    await client.end()
    return
  }

  // Seed users
  const passwordHash = await bcrypt.hash('Password123!', 10)

  const seekerId = randomUUID()
  await client.query(
    `INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, email_verified, phone_verified, timezone, language)
     VALUES ($1, $2, $3, 'seeker', 'active', 'Demo', 'Seeker', true, true, 'UTC', 'en')`,
    [seekerId, 'seeker@example.com', passwordHash]
  )

  const consultantUserIds: string[] = []
  const consultantProfiles = [
    { email: 'consultant1@example.com', first: 'Alice', last: 'Smith', title: 'Senior Software Engineer', rate: 150, years: 10 },
    { email: 'consultant2@example.com', first: 'Bob', last: 'Jones', title: 'Business Strategist', rate: 200, years: 15 },
    { email: 'consultant3@example.com', first: 'Carol', last: 'Lee', title: 'Financial Advisor', rate: 180, years: 8 },
  ]

  for (const p of consultantProfiles) {
    const userId = randomUUID()
    consultantUserIds.push(userId)
    await client.query(
      `INSERT INTO users (id, email, password_hash, role, status, first_name, last_name, email_verified, phone_verified, timezone, language)
       VALUES ($1, $2, $3, 'consultant', 'active', $4, $5, true, true, 'UTC', 'en')`,
      [userId, p.email, passwordHash, p.first, p.last]
    )

    const consultantId = randomUUID()
    await client.query(
      `INSERT INTO consultants (id, user_id, title, bio, hourly_rate, currency, experience_years, is_verified, is_available, verification_status)
       VALUES ($1, $2, $3, $4, $5, 'USD', $6, true, true, 'approved')`,
      [consultantId, userId, p.title, `${p.first} is an experienced ${p.title.toLowerCase()} with ${p.years} years in the field.`, p.rate, p.years]
    )
  }

  console.log('Seeded:')
  console.log('  seeker@example.com / Password123!')
  console.log('  consultant1@example.com / Password123!')
  console.log('  consultant2@example.com / Password123!')
  console.log('  consultant3@example.com / Password123!')

  await client.end()
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})

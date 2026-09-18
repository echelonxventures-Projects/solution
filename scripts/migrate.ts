/**
 * Database migration runner
 * Executes SQL migration files in order against PostgreSQL
 *
 * Usage: npm run db:migrate
 */
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { Client } from 'pg'

const MIGRATIONS_DIR = join(__dirname, '..', 'database', 'migrations')

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

  // Create migrations tracking table
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)

  // Get applied migrations
  const { rows } = await client.query('SELECT filename FROM schema_migrations ORDER BY filename')
  const applied = new Set(rows.map((r: any) => r.filename))

  // Get migration files
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  let appliedCount = 0

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping (already applied): ${file}`)
      continue
    }

    console.log(`Applying: ${file}`)
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')

    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
      await client.query('COMMIT')
      appliedCount++
      console.log(`Applied: ${file}`)
    } catch (err: any) {
      await client.query('ROLLBACK')
      console.error(`Failed to apply ${file}:`, err.message)
      throw err
    }
  }

  console.log(`\nDone. ${appliedCount} migration(s) applied, ${applied.size} already present.`)
  await client.end()
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})

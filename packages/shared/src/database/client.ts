import pg, { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger';

const { Pool: PgPool } = pg;

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  poolMin: number;
  poolMax: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

const defaultConfig: DatabaseConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'consultancy',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  poolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export class DatabaseClient {
  private pool: Pool;
  private static instance: DatabaseClient;

  private constructor(config: DatabaseConfig = defaultConfig) {
    this.pool = new PgPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      min: config.poolMin,
      max: config.poolMax,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
    });

    this.pool.on('connect', () => {
      logger.debug('Database connection established');
    });

    this.pool.on('error', (err) => {
      logger.error('Database pool error', err);
    });
  }

  public static getInstance(config?: DatabaseConfig): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient(config);
    }
    return DatabaseClient.instance;
  }

  public async query<T extends QueryResultRow = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(sql, params);
      const duration = Date.now() - start;
      logger.debug('Query executed', {
        sql: sql.substring(0, 100),
        duration,
        rows: result.rowCount,
      });
      return result;
    } catch (error) {
      logger.error('Query error', error, { sql: sql.substring(0, 100) });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query<{ health: number }>('SELECT 1 as health');
      return result.rows[0]?.health === 1;
    } catch {
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool closed');
  }
}

// Helper functions for common queries

function toSnakeCase(key: string): string {
  return key.replace(/([A-Z])/g, (m) => '_' + m.toLowerCase());
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function keysToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toSnakeCase(k)] = v;
  }
  return out;
}

function rowToCamel<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[toCamelCase(k)] = v;
  }
  return out as T;
}

export async function findOne<T extends QueryResultRow>(
  table: string,
  conditions: Record<string, unknown>
): Promise<T | null> {
  const db = DatabaseClient.getInstance();
  const snakeConditions = keysToSnake(conditions);
  const keys = Object.keys(snakeConditions);
  const values = Object.values(snakeConditions);
  const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

  const result = await db.query(
    `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`,
    values
  );

  const row = result.rows[0];
  return row ? rowToCamel<T>(row) : null;
}

export async function findAll<T extends QueryResultRow>(
  table: string,
  conditions?: Record<string, unknown>,
  options?: { limit?: number; offset?: number; order?: string }
): Promise<T[]> {
  const db = DatabaseClient.getInstance();

  const snakeConditions = conditions ? keysToSnake(conditions) : undefined;

  let sql = `SELECT * FROM ${table}`;
  const values: unknown[] = [];

  if (snakeConditions && Object.keys(snakeConditions).length > 0) {
    const keys = Object.keys(snakeConditions);
    const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    sql += ` WHERE ${whereClause}`;
    values.push(...Object.values(snakeConditions!));
  }

  if (options?.order) {
    sql += ` ORDER BY ${options.order}`;
  }

  if (options?.limit) {
    sql += ` LIMIT $${values.length + 1}`;
    values.push(options.limit);
  }

  if (options?.offset) {
    sql += ` OFFSET $${values.length + 1}`;
    values.push(options.offset);
  }

  const result = await db.query(sql, values);
  return result.rows.map((r) => rowToCamel<T>(r));
}

export async function insert<T extends QueryResultRow>(
  table: string,
  data: Record<string, unknown>
): Promise<T> {
  const db = DatabaseClient.getInstance();
  const snakeData = keysToSnake(data);
  const keys = Object.keys(snakeData);
  const values = Object.values(snakeData);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const result = await db.query(
    `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  return rowToCamel<T>(result.rows[0]);
}

export async function update<T extends QueryResultRow>(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const db = DatabaseClient.getInstance();
  const snakeData = keysToSnake(data);
  const keys = Object.keys(snakeData);
  const values = Object.values(snakeData);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const result = await db.query(
    `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );

  return result.rows[0] ? rowToCamel<T>(result.rows[0]) : null;
}

export async function deleteOne(table: string, id: string): Promise<boolean> {
  const db = DatabaseClient.getInstance();
  const result = await db.query(
    `DELETE FROM ${table} WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function softDelete(table: string, id: string): Promise<boolean> {
  const db = DatabaseClient.getInstance();
  const result = await db.query(
    `UPDATE ${table} SET deleted_at = NOW() WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export default DatabaseClient;
"""
Database Connection Module
"""

import asyncpg
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
from structlog import get_logger

from app.config import settings

logger = get_logger()

pool: Optional[asyncpg.Pool] = None


async def init_db():
    """Initialize database connection pool"""
    global pool
    pool = await asyncpg.create_pool(
        settings.DATABASE_URL,
        min_size=5,
        max_size=20,
        command_timeout=60,
    )
    logger.info("Database pool created")


async def close_db():
    """Close database connection pool"""
    global pool
    if pool:
        await pool.close()
        logger.info("Database pool closed")


async def get_connection():
    """Get a database connection from the pool"""
    global pool
    if pool is None:
        await init_db()
    return pool.acquire()


async def query_one(table: str, conditions: Dict[str, Any]) -> Optional[Dict]:
    """Query one record from database"""
    async with pool.acquire() as conn:
        where_clauses = []
        values = []
        for i, (key, value) in enumerate(conditions.items()):
            where_clauses.append(f"{key} = $${i+1}$$")
            values.append(value)

        where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"
        query = f"SELECT * FROM {table} WHERE {where_sql} AND deleted_at IS NULL LIMIT 1"

        row = await conn.fetchrow(query, *values)
        if row:
            return dict(row)
        return None


async def query_all(table: str, conditions: Dict[str, Any] = None,
                   order_by: str = None, limit: int = 100) -> List[Dict]:
    """Query all records from database"""
    async with pool.acquire() as conn:
        where_clauses = []
        values = []
        if conditions:
            for i, (key, value) in enumerate(conditions.items()):
                where_clauses.append(f"{key} = $${i+1}$$")
                values.append(value)

        where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"
        order_sql = f"ORDER BY {order_by}" if order_by else ""
        query = f"SELECT * FROM {table} WHERE {where_sql} AND deleted_at IS NULL {order_sql} LIMIT {limit}"

        rows = await conn.fetch(query, *values)
        return [dict(row) for row in rows]


async def insert_one(table: str, data: Dict[str, Any]) -> Dict:
    """Insert one record into database"""
    async with pool.acquire() as conn:
        columns = []
        values = []
        placeholders = []
        for i, (key, value) in enumerate(data.items()):
            columns.append(key)
            values.append(value)
            placeholders.append(f"$$${i+1}$$")

        columns_sql = ", ".join(columns)
        placeholders_sql = ", ".join(placeholders)
        query = f"""
            INSERT INTO {table} ({columns_sql})
            VALUES ({placeholders_sql})
            RETURNING *
        """

        row = await conn.fetchrow(query, *values)
        return dict(row)


async def update_one(table: str, id: str, data: Dict[str, Any]) -> Dict:
    """Update one record in database"""
    async with pool.acquire() as conn:
        updates = []
        values = [id]
        for i, (key, value) in enumerate(data.items()):
            updates.append(f"{key} = $${i+2}$$")
            values.append(value)

        updates_sql = ", ".join(updates)
        query = f"""
            UPDATE {table}
            SET {updates_sql}, updated_at = NOW()
            WHERE id = $$1$$
            RETURNING *
        """

        row = await conn.fetchrow(query, *values)
        return dict(row) if row else None


async def execute_raw(query: str, *args) -> List[Dict]:
    """Execute raw SQL query"""
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]


async def get_consultant_with_profile(consultant_id: str) -> Optional[Dict]:
    """Get consultant with full profile data"""
    async with pool.acquire() as conn:
        query = """
            SELECT
                c.*,
                cp.title as profile_title,
                cp.bio,
                cp.skills,
                cp.certifications,
                cp.languages,
                cp.verticals,
                cp.sub_verticals,
                cp.hourly_rate,
                cp.flat_rate,
                cp.currency,
                cp.rating,
                cp.review_count,
                cp.total_sessions,
                cp.response_time_minutes,
                cp.verified,
                cp.profile_image,
                u.name as user_name,
                u.email
            FROM consultants c
            LEFT JOIN consultant_profiles cp ON c.id = cp.consultant_id
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = $1 AND c.deleted_at IS NULL
        """
        row = await conn.fetchrow(query, consultant_id)
        return dict(row) if row else None


async def get_all_active_consultants() -> List[Dict]:
    """Get all active consultants with profiles"""
    async with pool.acquire() as conn:
        query = """
            SELECT
                c.id,
                c.user_id,
                c.status,
                u.name,
                cp.title,
                cp.bio,
                cp.skills,
                cp.verticals,
                cp.sub_verticals,
                cp.hourly_rate,
                cp.rating,
                cp.review_count,
                cp.verified,
                cp.languages,
                cp.profile_image
            FROM consultants c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN consultant_profiles cp ON c.id = cp.consultant_id
            WHERE c.status = 'active' AND c.deleted_at IS NULL
            ORDER BY cp.rating DESC, cp.review_count DESC
        """
        rows = await conn.fetch(query)
        return [dict(row) for row in rows]
"""
Storage Clients for Vector, Graph, and Document stores
"""

import json
from typing import List, Dict, Optional, Any
import asyncio
from datetime import datetime
import numpy as np
from structlog import get_logger

from app.config import settings

logger = get_logger()

# Client instances
pinecone_client = None
pinecone_index = None
neo4j_driver = None
mongo_client = None
mongo_db = None
redis_client = None
openai_client = None


async def init_storage_clients():
    """Initialize all storage clients"""
    global pinecone_client, pinecone_index, neo4j_driver, mongo_client, mongo_db, redis_client, openai_client

    # Initialize Pinecone
    if settings.PINECONE_API_KEY:
        try:
            import pinecone
            pinecone_client = pinecone.Pinecone(api_key=settings.PINECONE_API_KEY)
            pinecone_index = pinecone_client.Index(settings.PINECONE_INDEX_NAME)
            logger.info("Pinecone client initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Pinecone: {e}")

    # Initialize Neo4j
    if settings.NEO4J_URI:
        try:
            from neo4j import AsyncGraphDatabase
            neo4j_driver = AsyncGraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            )
            logger.info("Neo4j driver initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Neo4j: {e}")

    # Initialize MongoDB
    if settings.MONGODB_URI:
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            mongo_client = AsyncIOMotorClient(settings.MONGODB_URI)
            mongo_db = mongo_client[settings.MONGODB_DB_NAME]
            logger.info("MongoDB client initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize MongoDB: {e}")

    # Initialize Redis
    if settings.REDIS_URL:
        try:
            import redis.asyncio as redis_async
            redis_client = redis_async.from_url(
                f"redis://{settings.REDIS_URL}/{settings.REDIS_DB}"
            )
            logger.info("Redis client initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Redis: {e}")

    # Initialize OpenAI for embeddings
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("OpenAI client initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI: {e}")


# Vector Storage (Pinecone)
async def store_vector(
    id: str,
    embedding: List[float],
    metadata: Dict[str, Any],
) -> bool:
    """Store vector in Pinecone"""
    if not pinecone_index:
        logger.warning("Pinecone not initialized, storing in MongoDB instead")
        return await store_document("vectors", {
            "id": id,
            "embedding": embedding,
            "metadata": metadata,
        })

    try:
        pinecone_index.upsert(vectors=[(id, embedding, metadata)])
        return True
    except Exception as e:
        logger.error(f"Vector storage error: {e}")
        return False


async def query_vectors(
    query_embedding: List[float],
    top_k: int = 10,
    filter: Optional[Dict] = None,
    include_metadata: bool = True,
) -> List[Dict]:
    """Query vectors from Pinecone"""
    if not pinecone_index:
        logger.warning("Pinecone not initialized")
        return []

    try:
        results = pinecone_index.query(
            vector=query_embedding,
            top_k=top_k,
            filter=filter,
            include_metadata=include_metadata,
        )

        matches = []
        for match in results.matches:
            matches.append({
                "id": match.id,
                "score": match.score,
                "metadata": match.metadata,
            })

        return matches
    except Exception as e:
        logger.error(f"Vector query error: {e}")
        return []


async def delete_vector(id: str) -> bool:
    """Delete vector from Pinecone"""
    if not pinecone_index:
        return False

    try:
        pinecone_index.delete(ids=[id])
        return True
    except Exception as e:
        logger.error(f"Vector delete error: {e}")
        return False


# Knowledge Graph (Neo4j)
async def create_node(
    node_type: str,
    node_id: str,
    properties: Dict[str, Any],
) -> bool:
    """Create node in Neo4j"""
    if not neo4j_driver:
        logger.warning("Neo4j not initialized")
        return False

    try:
        query = f"""
        MERGE (n:{node_type} {{id: $id}})
        SET n += $properties, n.created_at = datetime()
        RETURN n
        """

        async with neo4j_driver.session() as session:
            result = await session.run(
                query,
                id=node_id,
                properties=properties,
            )
            await result.consume()

        return True
    except Exception as e:
        logger.error(f"Node creation error: {e}")
        return False


async def create_relationship(
    source_id: str,
    target_id: str,
    relationship: str,
    properties: Optional[Dict] = None,
    weight: float = 1.0,
) -> bool:
    """Create relationship in Neo4j"""
    if not neo4j_driver:
        return False

    try:
        query = """
        MATCH (a {id: $source_id}), (b {id: $target_id})
        MERGE (a)-[r:RELATIONSHIP {type: $rel_type}]->(b)
        SET r += $properties, r.weight = $weight, r.created_at = datetime()
        """

        async with neo4j_driver.session() as session:
            result = await session.run(
                query,
                source_id=source_id,
                target_id=target_id,
                rel_type=relationship,
                properties=properties or {},
                weight=weight,
            )
            await result.consume()

        return True
    except Exception as e:
        logger.error(f"Relationship creation error: {e}")
        return False


async def query_graph(
    start_node_id: str,
    relationships: List[str],
    depth: int = 2,
    limit: int = 50,
) -> Dict:
    """Query knowledge graph"""
    if not neo4j_driver:
        return {"nodes": [], "edges": []}

    try:
        rel_pattern = "|".join(relationships) if relationships else ""

        query = f"""
        MATCH path = (start {{id: $start_id}})-[*1..{depth}]-(end)
        WHERE $rel_pattern = '' OR ANY(r IN relationships(path) WHERE type(r) IN split($rel_pattern, '|'))
        RETURN path
        LIMIT $limit
        """

        async with neo4j_driver.session() as session:
            result = await session.run(
                query,
                start_id=start_node_id,
                rel_pattern=rel_pattern,
                limit=limit,
            )

            nodes = []
            edges = []

            for record in await result.data():
                path = record.get("path", [])

            return {"nodes": nodes, "edges": edges}
    except Exception as e:
        logger.error(f"Graph query error: {e}")
        return {"nodes": [], "edges": []}


async def find_related_nodes(
    node_id: str,
    relationship_type: Optional[str] = None,
    limit: int = 20,
) -> List[Dict]:
    """Find nodes related to a given node"""
    if not neo4j_driver:
        return []

    try:
        query = """
        MATCH (a {id: $node_id})-[r]-(b)
        WHERE $rel_type = '' OR type(r) = $rel_type
        RETURN b.id, labels(b), b, type(r), r.weight
        LIMIT $limit
        """

        async with neo4j_driver.session() as session:
            result = await session.run(
                query,
                node_id=node_id,
                rel_type=relationship_type or "",
                limit=limit,
            )

            related = []
            for record in await result.data():
                related.append(record)

            return related
    except Exception as e:
        logger.error(f"Related nodes query error: {e}")
        return []


# Document Storage (MongoDB)
async def store_document(
    collection: str,
    document: Dict[str, Any],
) -> bool:
    """Store document in MongoDB"""
    if not mongo_db:
        logger.warning("MongoDB not initialized")
        return False

    try:
        coll = mongo_db[collection]
        document["created_at"] = datetime.utcnow()
        await coll.insert_one(document)
        return True
    except Exception as e:
        logger.error(f"Document storage error: {e}")
        return False


async def query_documents(
    collection: str,
    filter: Dict[str, Any],
    limit: int = 100,
    sort: Optional[Dict] = None,
) -> List[Dict]:
    """Query documents from MongoDB"""
    if not mongo_db:
        return []

    try:
        coll = mongo_db[collection]
        cursor = coll.find(filter).limit(limit)

        if sort:
            cursor = cursor.sort(list(sort.items()))

        documents = []
        for doc in await cursor.to_list(length=limit):
            doc["_id"] = str(doc["_id"])
            documents.append(doc)

        return documents
    except Exception as e:
        logger.error(f"Document query error: {e}")
        return []


async def update_document(
    collection: str,
    id: str,
    updates: Dict[str, Any],
) -> bool:
    """Update document in MongoDB"""
    if not mongo_db:
        return False

    try:
        coll = mongo_db[collection]
        updates["updated_at"] = datetime.utcnow()
        await coll.update_one({"id": id}, {"$set": updates})
        return True
    except Exception as e:
        logger.error(f"Document update error: {e}")
        return False


async def delete_document(collection: str, id: str) -> bool:
    """Delete document from MongoDB"""
    if not mongo_db:
        return False

    try:
        coll = mongo_db[collection]
        await coll.delete_one({"id": id})
        return True
    except Exception as e:
        logger.error(f"Document delete error: {e}")
        return False


# Working Memory (Redis)
async def set_working_memory(
    key: str,
    value: Dict[str, Any],
    ttl_seconds: int = 3600,
) -> bool:
    """Set working memory in Redis"""
    if not redis_client:
        logger.warning("Redis not initialized")
        return False

    try:
        await redis_client.set(
            key,
            json.dumps(value),
            ex=ttl_seconds,
        )
        return True
    except Exception as e:
        logger.error(f"Redis set error: {e}")
        return False


async def get_working_memory(key: str) -> Optional[Dict]:
    """Get working memory from Redis"""
    if not redis_client:
        return None

    try:
        value = await redis_client.get(key)
        if value:
            return json.loads(value)
        return None
    except Exception as e:
        logger.error(f"Redis get error: {e}")
        return None


async def delete_working_memory(key: str) -> bool:
    """Delete working memory from Redis"""
    if not redis_client:
        return False

    try:
        await redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Redis delete error: {e}")
        return False


async def append_to_memory_list(
    key: str,
    item: Dict[str, Any],
    max_size: int = 100,
) -> bool:
    """Append item to a list in Redis"""
    if not redis_client:
        return False

    try:
        # Push to list
        await redis_client.lpush(key, json.dumps(item))

        # Trim to max size
        await redis_client.ltrim(key, 0, max_size - 1)

        return True
    except Exception as e:
        logger.error(f"Redis list append error: {e}")
        return False


async def get_memory_list(key: str, count: int = 10) -> List[Dict]:
    """Get items from memory list"""
    if not redis_client:
        return []

    try:
        items = await redis_client.lrange(key, 0, count - 1)
        return [json.loads(item) for item in items]
    except Exception as e:
        logger.error(f"Redis list get error: {e}")
        return []


# Embeddings
async def generate_embedding(text: str) -> List[float]:
    """Generate embedding for text"""
    if not openai_client:
        logger.warning("OpenAI not initialized, using fallback")
        # Fallback: use numpy random for now (not production)
        return list(np.random.randn(settings.EMBEDDINGS_DIMENSION).astype(float))

    try:
        response = await openai_client.embeddings.create(
            model=settings.EMBEDDINGS_MODEL,
            input=text,
        )

        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Embedding generation error: {e}")
        return []


async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for multiple texts"""
    if not openai_client:
        return [await generate_embedding(t) for t in texts]

    try:
        response = await openai_client.embeddings.create(
            model=settings.EMBEDDINGS_MODEL,
            input=texts,
        )

        return [d.embedding for d in response.data]
    except Exception as e:
        logger.error(f"Batch embedding error: {e}")
        return []


def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    a_array = np.array(a)
    b_array = np.array(b)

    dot_product = np.dot(a_array, b_array)
    norm_a = np.linalg.norm(a_array)
    norm_b = np.linalg.norm(b_array)

    return dot_product / (norm_a * norm_b)


def close_storage_clients():
    """Close all storage clients"""
    global neo4j_driver, mongo_client, redis_client

    if neo4j_driver:
        neo4j_driver.close()

    if mongo_client:
        mongo_client.close()

    if redis_client:
        redis_client.close()
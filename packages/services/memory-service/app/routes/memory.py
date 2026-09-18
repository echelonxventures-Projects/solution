"""
API Routes for Memory CRUD
"""

import json
import time
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import (
    MemoryCreate, MemoryRecord, MemoryType, MemoryPriority,
    MemorySearch, MemorySearchResult, MemorySearchResponse, MemoryStats
)
from app.storage import (
    store_vector, query_vectors, generate_embedding,
    store_document, query_documents, update_document, delete_document,
    set_working_memory, get_working_memory, delete_working_memory,
    create_node, create_relationship,
)
from app.config import settings

logger = get_logger()
router = APIRouter()


@router.post("/", response_model=MemoryRecord)
async def create_memory(request: MemoryCreate):
    """
    Create a new memory

    - Generates embedding for content
    - Stores in vector database
    - Stores metadata in document store
    - Creates knowledge graph node
    """
    start_time = time.time()

    try:
        memory_id = f"mem_{request.user_id}_{datetime.utcnow().timestamp()}"

        # Generate embedding if not provided
        embedding = request.embedding
        if not embedding:
            embedding = await generate_embedding(request.content)

        # Calculate initial importance score
        importance_score = calculate_importance_score(request.priority, request.memory_type)

        # Metadata for vector storage
        vector_metadata = {
            "user_id": request.user_id,
            "memory_type": request.memory_type.value,
            "priority": request.priority.value,
            "source": request.source or "user",
            "importance_score": importance_score,
            "created_at": datetime.utcnow().isoformat(),
        }

        # Store in vector database
        await store_vector(memory_id, embedding, vector_metadata)

        # Store full record in document store
        full_record = {
            "id": memory_id,
            "user_id": request.user_id,
            "memory_type": request.memory_type.value,
            "content": request.content,
            "metadata": request.metadata or {},
            "priority": request.priority.value,
            "embedding": embedding,
            "importance_score": importance_score,
            "access_count": 0,
            "last_accessed": datetime.utcnow(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "consolidated": False,
            "source": request.source or "user",
            "context": request.context or {},
        }

        await store_document("memories", full_record)

        # Create knowledge graph node
        await create_node("Memory", memory_id, {
            "user_id": request.user_id,
            "type": request.memory_type.value,
            "importance": importance_score,
        })

        # Link to user
        await create_relationship(
            request.user_id,
            memory_id,
            "HAS_MEMORY",
            {"memory_type": request.memory_type.value},
            weight=importance_score,
        )

        return MemoryRecord(**full_record)

    except Exception as e:
        logger.error(f"Memory creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{memory_id}", response_model=MemoryRecord)
async def get_memory(memory_id: str):
    """
    Get a specific memory by ID
    """
    try:
        memories = await query_documents("memories", {"id": memory_id}, limit=1)

        if not memories:
            raise HTTPException(status_code=404, detail="Memory not found")

        memory = memories[0]

        # Update access count and last accessed
        await update_document("memories", memory_id, {
            "access_count": memory.get("access_count", 0) + 1,
            "last_accessed": datetime.utcnow(),
        })

        return MemoryRecord(**memory)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Memory retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=MemorySearchResponse)
async def search_memories(request: MemorySearch):
    """
    Search memories using vector similarity

    - Generates query embedding
    - Searches vector database
    - Returns ranked results
    """
    start_time = time.time()

    try:
        # Generate query embedding
        query_embedding = await generate_embedding(request.query)

        # Build filter
        filter_dict = {"user_id": request.user_id}
        if request.memory_types:
            filter_dict["memory_type"] = {"$in": [t.value for t in request.memory_types]}

        # Query vectors
        threshold = request.similarity_threshold or settings.MEMORY_SIMILARITY_THRESHOLD
        vector_results = await query_vectors(
            query_embedding=query_embedding,
            top_k=request.top_k,
            filter=filter_dict,
        )

        # Build results
        results = []
        for match in vector_results:
            if match["score"] >= threshold:
                # Get full memory record
                memories = await query_documents("memories", {"id": match["id"]}, limit=1)

                if memories:
                    memory = memories[0]
                    results.append(MemorySearchResult(
                        memory=MemoryRecord(**memory),
                        similarity=match["score"],
                        relevance_explanation=None,
                    ))

        processing_time = (time.time() - start_time) * 1000

        return MemorySearchResponse(
            query=request.query,
            results=results,
            total=len(results),
            processing_time_ms=processing_time,
        )

    except Exception as e:
        logger.error(f"Memory search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{memory_id}")
async def update_memory(memory_id: str, updates: dict):
    """
    Update memory properties
    """
    try:
        # Check memory exists
        memories = await query_documents("memories", {"id": memory_id}, limit=1)

        if not memories:
            raise HTTPException(status_code=404, detail="Memory not found")

        # Update document
        updates["updated_at"] = datetime.utcnow()
        await update_document("memories", memory_id, updates)

        # If content changed, regenerate embedding
        if "content" in updates:
            new_embedding = await generate_embedding(updates["content"])
            await store_vector(memory_id, new_embedding, {"updated": True})

        return {"updated": True, "memory_id": memory_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Memory update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str):
    """
    Delete a memory
    """
    try:
        # Delete from vector store
        await delete_vector(memory_id)

        # Delete from document store
        await delete_document("memories", memory_id)

        return {"deleted": True, "memory_id": memory_id}

    except Exception as e:
        logger.error(f"Memory delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}/stats", response_model=MemoryStats)
async def get_user_memory_stats(user_id: str):
    """
    Get memory statistics for a user
    """
    try:
        memories = await query_documents("memories", {"user_id": user_id}, limit=1000)

        if not memories:
            return MemoryStats(
                user_id=user_id,
                total_memories=0,
                by_type={},
                by_priority={},
                avg_importance=0,
                avg_access_count=0,
                oldest_memory=None,
                newest_memory=None,
                consolidation_status="none",
            )

        # Calculate stats
        by_type = {}
        by_priority = {}
        importance_scores = []
        access_counts = []
        dates = []

        for m in memories:
            mem_type = m.get("memory_type", "unknown")
            priority = m.get("priority", "medium")

            by_type[mem_type] = by_type.get(mem_type, 0) + 1
            by_priority[priority] = by_priority.get(priority, 0) + 1

            importance_scores.append(m.get("importance_score", 0))
            access_counts.append(m.get("access_count", 0))

            created_at = m.get("created_at")
            if created_at:
                dates.append(created_at)

        return MemoryStats(
            user_id=user_id,
            total_memories=len(memories),
            by_type=by_type,
            by_priority=by_priority,
            avg_importance=sum(importance_scores) / len(importance_scores) if importance_scores else 0,
            avg_access_count=sum(access_counts) / len(access_counts) if access_counts else 0,
            oldest_memory=min(dates) if dates else None,
            newest_memory=max(dates) if dates else None,
            consolidation_status="active",
        )

    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}/recent")
async def get_recent_memories(user_id: str, limit: int = 20):
    """
    Get recent memories for a user
    """
    try:
        memories = await query_documents(
            "memories",
            {"user_id": user_id},
            limit=limit,
            sort={"created_at": -1},
        )

        return {
            "user_id": user_id,
            "memories": memories,
            "total": len(memories),
        }

    except Exception as e:
        logger.error(f"Recent memories error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def calculate_importance_score(priority: MemoryPriority, memory_type: MemoryType) -> float:
    """Calculate initial importance score"""
    priority_scores = {
        MemoryPriority.HIGH: 0.9,
        MemoryPriority.MEDIUM: 0.6,
        MemoryPriority.LOW: 0.3,
    }

    type_weights = {
        MemoryType.USER_PROFILE: 1.0,
        MemoryType.EPISODIC: 0.8,
        MemoryType.SEMANTIC: 0.7,
        MemoryType.CONVERSATION: 0.5,
        MemoryType.PROCEDURAL: 0.6,
    }

    base_score = priority_scores[priority]
    type_weight = type_weights.get(memory_type, 0.5)

    return base_score * type_weight
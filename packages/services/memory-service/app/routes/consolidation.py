"""
API Routes for Memory Consolidation
"""

import asyncio
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import ConsolidationRequest, ConsolidationReport
from app.storage import query_documents, update_document, store_document, generate_embedding, store_vector
from app.config import settings

logger = get_logger()
router = APIRouter()


@router.post("/run")
async def run_consolidation(request: ConsolidationRequest):
    """
    Run memory consolidation for a user

    - Identifies memories to consolidate
    - Merges similar memories
    - Updates importance scores
    - Archives old/low importance memories
    """
    try:
        start_time = datetime.utcnow()

        # Get all memories for user
        memories = await query_documents(
            "memories",
            {"user_id": request.user_id},
            limit=1000,
        )

        if not memories:
            return ConsolidationReport(
                user_id=request.user_id,
                memories_processed=0,
                memories_consolidated=0,
                memories_archived=0,
                memories_created=0,
                duration_seconds=0,
                timestamp=start_time,
            )

        # Process memories
        processed = len(memories)
        consolidated = 0
        archived = 0
        created = 0

        # Identify consolidation candidates
        to_consolidate = []
        to_archive = []

        retention_date = datetime.utcnow() - timedelta(days=settings.MEMORY_RETENTION_DAYS)

        for memory in memories:
            importance = memory.get("importance_score", 0.5)
            access_count = memory.get("access_count", 0)
            created_at = memory.get("created_at", datetime.utcnow())

            # Check if should archive
            if importance < 0.2 or created_at < retention_date:
                if access_count < 2:
                    to_archive.append(memory)
                    continue

            # Check if needs consolidation boost
            if access_count > 5 and importance < 0.8:
                to_consolidate.append(memory)

        # Perform consolidation
        for memory in to_consolidate:
            # Boost importance based on access
            new_importance = min(0.9, memory["importance_score"] + 0.05 * min(memory["access_count"], 10))
            await update_document("memories", memory["id"], {
                "importance_score": new_importance,
                "consolidated": True,
                "consolidated_at": datetime.utcnow(),
            })
            consolidated += 1

        # Archive memories
        for memory in to_archive:
            await update_document("memories", memory["id"], {
                "archived": True,
                "archived_at": datetime.utcnow(),
                "importance_score": 0,
            })
            archived += 1

        # Create consolidated memory summaries if enough similar memories
        similar_groups = await find_similar_memories(memories)
        for group in similar_groups:
            if len(group) >= 3:
                # Create summary memory
                summary = await create_summary_memory(request.user_id, group)
                if summary:
                    created += 1

        duration = (datetime.utcnow() - start_time).total_seconds()

        return ConsolidationReport(
            user_id=request.user_id,
            memories_processed=processed,
            memories_consolidated=consolidated,
            memories_archived=archived,
            memories_created=created,
            duration_seconds=duration,
            timestamp=start_time,
        )

    except Exception as e:
        logger.error(f"Consolidation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{user_id}")
async def get_consolidation_status(user_id: str):
    """
    Get consolidation status for user
    """
    try:
        memories = await query_documents("memories", {"user_id": user_id}, limit=100)

        total = len(memories)
        consolidated = sum(1 for m in memories if m.get("consolidated"))
        archived = sum(1 for m in memories if m.get("archived"))

        pending = total - consolidated - archived

        return {
            "user_id": user_id,
            "total_memories": total,
            "consolidated": consolidated,
            "archived": archived,
            "pending_consolidation": pending,
            "next_consolidation": "scheduled",
        }

    except Exception as e:
        logger.error(f"Consolidation status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def batch_consolidation(user_ids: list):
    """
    Run consolidation for multiple users
    """
    results = []

    for user_id in user_ids:
        request = ConsolidationRequest(user_id=user_id)
        result = await run_consolidation(request)
        results.append(result)

    return {
        "total_users": len(user_ids),
        "results": results,
    }


async def find_similar_memories(memories: list) -> list:
    """Find groups of similar memories"""
    from app.storage import cosine_similarity

    groups = []
    used = set()

    for i, m1 in enumerate(memories):
        if i in used or m1.get("archived"):
            continue

        group = [m1]

        for j, m2 in enumerate(memories[i+1:], i+1):
            if j in used or m2.get("archived"):
                continue

            # Check if similar type and time
            if m1.get("memory_type") == m2.get("memory_type"):
                time_diff = abs(
                    (m1.get("created_at", datetime.utcnow()) -
                     m2.get("created_at", datetime.utcnow())).total_seconds()
                )

                if time_diff < 86400:  # Within 24 hours
                    # Check embedding similarity
                    if m1.get("embedding") and m2.get("embedding"):
                        sim = cosine_similarity(m1["embedding"], m2["embedding"])

                        if sim > 0.85:
                            group.append(m2)
                            used.add(j)

        if len(group) > 1:
            groups.append(group)

    return groups


async def create_summary_memory(user_id: str, memories: list) -> dict:
    """Create a summary memory from a group of similar memories"""
    # Combine content
    combined_content = "\n".join([m.get("content", "") for m in memories])

    # Generate summary using LLM (simplified for now)
    summary_content = f"Consolidated from {len(memories)} related memories: {combined_content[:500]}"

    # Generate embedding
    embedding = await generate_embedding(summary_content)

    # Store
    memory_id = f"consolidated_{user_id}_{datetime.utcnow().timestamp()}"

    record = {
        "id": memory_id,
        "user_id": user_id,
        "memory_type": "semantic",
        "content": summary_content,
        "priority": "medium",
        "embedding": embedding,
        "importance_score": 0.7,
        "access_count": 0,
        "created_at": datetime.utcnow(),
        "consolidated": True,
        "source": "consolidation",
        "source_memories": [m["id"] for m in memories],
    }

    await store_document("memories", record)
    await store_vector(memory_id, embedding, {
        "user_id": user_id,
        "memory_type": "semantic",
        "consolidated": True,
    })

    return record
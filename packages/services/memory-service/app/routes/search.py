"""
API Routes for Memory Search
"""

import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import MemorySearch, MemorySearchResult, MemorySearchResponse, MemoryType
from app.storage import (
    generate_embedding, query_vectors, query_documents,
    query_graph, find_related_nodes, cosine_similarity,
)

logger = get_logger()
router = APIRouter()


@router.post("/semantic", response_model=MemorySearchResponse)
async def semantic_search(request: MemorySearch):
    """
    Semantic search using vector embeddings
    """
    from app.routes.memory import search_memories
    return await search_memories(request)


@router.post("/hybrid")
async def hybrid_search(
    user_id: str,
    query: str,
    memory_types: Optional[List[MemoryType]] = None,
    top_k: int = 10,
    include_graph: bool = True,
):
    """
    Hybrid search combining semantic and graph-based search
    """
    try:
        # Semantic search
        semantic_results = await semantic_search(MemorySearch(
            user_id=user_id,
            query=query,
            memory_types=memory_types,
            top_k=top_k,
        ))

        # Graph-based search
        graph_results = []
        if include_graph:
            # Find related entities from knowledge graph
            related = await find_related_nodes(user_id, limit=20)

            # Query memories related to these entities
            for entity in related[:5]:
                entity_memories = await query_documents(
                    "memories",
                    {"user_id": user_id},
                    limit=5,
                )
                graph_results.extend(entity_memories)

        # Combine and deduplicate
        all_results = semantic_results.results + [
            MemorySearchResult(
                memory=m,
                similarity=0.5,  # Default for graph results
            )
            for m in graph_results
        ]

        # Deduplicate by memory ID
        seen = set()
        combined = []
        for r in all_results:
            if r.memory.id not in seen:
                seen.add(r.memory.id)
                combined.append(r)

        return {
            "query": query,
            "semantic_results": len(semantic_results.results),
            "graph_results": len(graph_results),
            "combined_results": combined[:top_k],
            "total": len(combined),
        }

    except Exception as e:
        logger.error(f"Hybrid search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contextual")
async def contextual_search(
    user_id: str,
    query: str,
    context: dict,
    top_k: int = 10,
):
    """
    Search with additional context weighting
    """
    try:
        # Build enhanced query with context
        enhanced_query = f"{query}\nContext: {json.dumps(context)}"

        # Generate embedding for enhanced query
        query_embedding = await generate_embedding(enhanced_query)

        # Search vectors
        results = await query_vectors(
            query_embedding=query_embedding,
            top_k=top_k,
            filter={"user_id": user_id},
        )

        # Get full records
        memories = []
        for match in results:
            docs = await query_documents("memories", {"id": match["id"]}, limit=1)
            if docs:
                memories.append(docs[0])

        return {
            "query": query,
            "context": context,
            "results": memories,
            "total": len(memories),
        }

    except Exception as e:
        logger.error(f"Contextual search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/related")
async def find_related_memories(
    memory_id: str,
    top_k: int = 10,
    similarity_threshold: float = 0.8,
):
    """
    Find memories related to a specific memory
    """
    try:
        # Get source memory
        source_memories = await query_documents("memories", {"id": memory_id}, limit=1)

        if not source_memories:
            raise HTTPException(status_code=404, detail="Memory not found")

        source = source_memories[0]
        source_embedding = source.get("embedding")

        if not source_embedding:
            raise HTTPException(status_code=400, detail="Memory has no embedding")

        # Search similar vectors
        similar = await query_vectors(
            query_embedding=source_embedding,
            top_k=top_k + 1,  # Include self
        )

        # Filter results
        related = []
        for match in similar:
            if match["id"] != memory_id and match["score"] >= similarity_threshold:
                docs = await query_documents("memories", {"id": match["id"]}, limit=1)
                if docs:
                    related.append({
                        "memory": docs[0],
                        "similarity": match["score"],
                    })

        return {
            "source_memory_id": memory_id,
            "related_memories": related[:top_k],
            "total": len(related),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Related memories error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggest/{user_id}")
async def suggest_memories(user_id: str, context: str, limit: int = 5):
    """
    Suggest relevant memories based on context
    """
    try:
        # Generate context embedding
        context_embedding = await generate_embedding(context)

        # Get user memories
        memories = await query_documents("memories", {"user_id": user_id}, limit=100)

        if not memories:
            return {"suggestions": [], "total": 0}

        # Rank by similarity to context
        ranked = []
        for m in memories:
            if m.get("embedding"):
                sim = cosine_similarity(context_embedding, m["embedding"])
                ranked.append({
                    "memory": m,
                    "similarity": sim,
                })

        # Sort by similarity
        ranked.sort(key=lambda x: x["similarity"], reverse=True)

        return {
            "user_id": user_id,
            "context": context,
            "suggestions": ranked[:limit],
            "total": len(ranked),
        }

    except Exception as e:
        logger.error(f"Memory suggestion error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/timeline")
async def memory_timeline(
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    memory_types: Optional[List[MemoryType]] = None,
    limit: int = 50,
):
    """
    Get memories in chronological order
    """
    from datetime import datetime

    try:
        # Build query
        filter_dict = {"user_id": user_id}

        if memory_types:
            filter_dict["memory_type"] = {"$in": [t.value for t in memory_types]}

        # Query with date range
        memories = await query_documents(
            "memories",
            filter_dict,
            limit=limit,
            sort={"created_at": 1},
        )

        # Filter by date range if specified
        if start_date:
            start_dt = datetime.fromisoformat(start_date)
            memories = [m for m in memories if m.get("created_at") >= start_dt]

        if end_date:
            end_dt = datetime.fromisoformat(end_date)
            memories = [m for m in memories if m.get("created_at") <= end_dt]

        return {
            "user_id": user_id,
            "timeline": memories,
            "total": len(memories),
        }

    except Exception as e:
        logger.error(f"Timeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
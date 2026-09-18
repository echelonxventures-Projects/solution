"""
API Routes for Agent Memory
"""

import json
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import AgentMemory, AgentMemoryRequest, AgentMemoryResponse, MemoryRecord
from app.storage import (
    generate_embedding, query_vectors, query_documents,
    get_working_memory, set_working_memory, append_to_memory_list, get_memory_list,
    find_related_nodes, query_graph,
)
from app.config import settings

logger = get_logger()
router = APIRouter()


@router.post("/retrieve", response_model=AgentMemoryResponse)
async def retrieve_agent_memory(request: AgentMemoryRequest):
    """
    Retrieve relevant memories for an agent

    - Searches vector store for contextually relevant memories
    - Retrieves from knowledge graph
    - Gets working memory state
    - Returns combined context
    """
    try:
        # Generate context embedding
        context_embedding = await generate_embedding(request.context)

        # Build filter
        filter_dict = {}
        if request.user_id:
            filter_dict["user_id"] = request.user_id

        # Query vector store
        vector_results = await query_vectors(
            query_embedding=context_embedding,
            top_k=request.max_memories,
            filter=filter_dict,
        )

        # Get full memory records
        memories = []
        for match in vector_results:
            if match["score"] >= settings.MEMORY_SIMILARITY_THRESHOLD:
                docs = await query_documents("memories", {"id": match["id"]}, limit=1)

                if docs:
                    doc = docs[0]
                    memories.append(AgentMemory(
                        agent_id=request.agent_id,
                        user_id=request.user_id,
                        session_id=request.session_id,
                        memory_type=doc.get("memory_type", "semantic"),
                        content=doc.get("content", ""),
                        context=doc.get("context", {}),
                        relevance_score=match["score"],
                        created_at=doc.get("created_at", datetime.utcnow()),
                    ))

        # Get knowledge graph context
        if request.user_id:
            graph_context = await query_graph(
                start_node_id=request.user_id,
                relationships=["HAS_MEMORY", "RELATED_TO"],
                depth=2,
                limit=20,
            )
        else:
            graph_context = {"nodes": [], "edges": []}

        # Get working memory
        working_key = f"working:{request.agent_id}:{request.session_id or 'default'}"
        working_context = await get_working_memory(working_key)

        # Build combined working context string
        working_context_str = build_working_context(memories, graph_context, working_context)

        return AgentMemoryResponse(
            agent_id=request.agent_id,
            memories=memories,
            working_context=working_context_str,
            total=len(memories),
        )

    except Exception as e:
        logger.error(f"Agent memory retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/store")
async def store_agent_memory(
    agent_id: str,
    user_id: Optional[str],
    session_id: Optional[str],
    content: str,
    memory_type: str = "conversation",
    context: dict = None,
):
    """
    Store memory from agent interaction
    """
    from app.routes.memory import create_memory, MemoryCreate, MemoryType, MemoryPriority

    try:
        request = MemoryCreate(
            user_id=user_id or f"agent_{agent_id}",
            memory_type=MemoryType(memory_type),
            content=content,
            priority=MemoryPriority.MEDIUM,
            source=agent_id,
            context=context or {"session_id": session_id, "agent_id": agent_id},
        )

        memory = await create_memory(request)

        # Also store in agent's working memory
        working_key = f"working:{agent_id}:{session_id or 'default'}"
        await append_to_memory_list(
            f"{working_key}:recent",
            {
                "memory_id": memory.id,
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

        return {"stored": True, "memory_id": memory.id}

    except Exception as e:
        logger.error(f"Agent memory storage error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/working")
async def update_working_memory(
    agent_id: str,
    session_id: Optional[str],
    context: dict,
    ttl_seconds: int = 3600,
):
    """
    Update agent's working memory state
    """
    try:
        key = f"working:{agent_id}:{session_id or 'default'}"

        # Get existing state
        existing = await get_working_memory(key) or {}

        # Merge updates
        updated = {**existing, **context, "updated_at": datetime.utcnow().isoformat()}

        # Store with TTL
        await set_working_memory(key, updated, ttl_seconds)

        return {"updated": True, "key": key}

    except Exception as e:
        logger.error(f"Working memory update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/working/{agent_id}")
async def get_working_state(agent_id: str, session_id: Optional[str] = None):
    """
    Get agent's working memory state
    """
    try:
        key = f"working:{agent_id}:{session_id or 'default'}"

        state = await get_working_memory(key)

        # Get recent memories
        recent_key = f"{key}:recent"
        recent = await get_memory_list(recent_key, count=10)

        return {
            "agent_id": agent_id,
            "session_id": session_id,
            "working_state": state,
            "recent_memories": recent,
        }

    except Exception as e:
        logger.error(f"Working state retrieval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/link")
async def link_memories(
    memory_id_1: str,
    memory_id_2: str,
    relationship: str = "RELATED_TO",
    weight: float = 0.5,
):
    """
    Create relationship between two memories
    """
    from app.storage import create_relationship

    try:
        await create_relationship(
            source_id=memory_id_1,
            target_id=memory_id_2,
            relationship=relationship,
            weight=weight,
        )

        return {"linked": True, "relationship": relationship}

    except Exception as e:
        logger.error(f"Memory linking error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/context/{agent_id}")
async def get_agent_context(agent_id: str, user_id: Optional[str] = None):
    """
    Get full context for agent including:
    - User profile memories
    - Recent interactions
    - Knowledge graph context
    """
    try:
        context = {
            "agent_id": agent_id,
            "user_profile": None,
            "recent_interactions": [],
            "related_topics": [],
        }

        if user_id:
            # Get user profile memories
            profile_memories = await query_documents(
                "memories",
                {"user_id": user_id, "memory_type": "user_profile"},
                limit=5,
            )
            context["user_profile"] = profile_memories

            # Get recent interactions
            recent = await query_documents(
                "memories",
                {"user_id": user_id, "memory_type": "conversation"},
                limit=10,
                sort={"created_at": -1},
            )
            context["recent_interactions"] = recent

            # Get related topics from knowledge graph
            related = await find_related_nodes(user_id, limit=20)
            context["related_topics"] = related

        return context

    except Exception as e:
        logger.error(f"Agent context error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def build_working_context(
    memories: List[AgentMemory],
    graph_context: dict,
    working_state: Optional[dict],
) -> str:
    """Build working context string from components"""
    parts = []

    # Add relevant memories
    if memories:
        parts.append("Relevant memories:")
        for m in memories[:5]:  # Top 5
            parts.append(f"- {m.content[:200]}")

    # Add graph context
    if graph_context.get("nodes"):
        parts.append("\nRelated entities:")
        for node in graph_context["nodes"][:10]:
            parts.append(f"- {node}")

    # Add working state
    if working_state:
        parts.append("\nCurrent context:")
        parts.append(json.dumps(working_state, indent=2))

    return "\n".join(parts)
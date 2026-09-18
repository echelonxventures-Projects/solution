"""
Pydantic Models for Memory Service
"""

from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class MemoryType(str, Enum):
    """Types of memory"""
    EPISODIC = "episodic"      # Events and experiences
    SEMANTIC = "semantic"      # Facts and knowledge
    PROCEDURAL = "procedural"  # How to do things
    CONVERSATION = "conversation"  # Conversation history
    USER_PROFILE = "user_profile"  # User preferences and history


class MemoryPriority(str, Enum):
    """Memory priority levels"""
    HIGH = "high"      # Always remember
    MEDIUM = "medium"  # Consolidate normally
    LOW = "low"        # May fade over time


class MemoryCreate(BaseModel):
    """Request to create a memory"""
    user_id: str = Field(..., description="User ID associated with memory")
    memory_type: MemoryType = Field(..., description="Type of memory")
    content: str = Field(..., description="Memory content/text")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")
    priority: MemoryPriority = Field(default=MemoryPriority.MEDIUM)
    source: Optional[str] = Field(default=None, description="Source of memory")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Context when memory was formed")
    embedding: Optional[List[float]] = Field(default=None, description="Pre-computed embedding")


class MemoryRecord(BaseModel):
    """Stored memory record"""
    id: str
    user_id: str
    memory_type: MemoryType
    content: str
    metadata: Dict[str, Any]
    priority: MemoryPriority
    embedding: List[float]
    importance_score: float
    access_count: int
    last_accessed: datetime
    created_at: datetime
    updated_at: datetime
    consolidated: bool
    source: str
    context: Dict[str, Any]


class MemorySearch(BaseModel):
    """Request to search memories"""
    user_id: str = Field(..., description="User ID to search")
    query: str = Field(..., description="Search query")
    memory_types: Optional[List[MemoryType]] = Field(default=None)
    top_k: int = Field(default=10, description="Number of results")
    similarity_threshold: Optional[float] = Field(default=None)
    include_context: bool = Field(default=True)


class MemorySearchResult(BaseModel):
    """Search result"""
    memory: MemoryRecord
    similarity: float
    relevance_explanation: Optional[str] = None


class MemorySearchResponse(BaseModel):
    """Search response"""
    query: str
    results: List[MemorySearchResult]
    total: int
    processing_time_ms: float


class AgentMemory(BaseModel):
    """Memory for AI agents"""
    agent_id: str = Field(..., description="Agent ID")
    user_id: Optional[str] = Field(default=None)
    session_id: Optional[str] = Field(default=None)
    memory_type: MemoryType
    content: str
    context: Dict[str, Any]
    relevance_score: float
    created_at: datetime


class AgentMemoryRequest(BaseModel):
    """Request for agent memory"""
    agent_id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    context: str = Field(..., description="Context for retrieval")
    max_memories: int = Field(default=20)


class AgentMemoryResponse(BaseModel):
    """Response for agent memory"""
    agent_id: str
    memories: List[AgentMemory]
    working_context: str
    total: int


class KnowledgeNode(BaseModel):
    """Knowledge graph node"""
    id: str
    type: str  # user, consultant, topic, skill, session
    properties: Dict[str, Any]
    created_at: datetime


class KnowledgeEdge(BaseModel):
    """Knowledge graph edge"""
    id: str
    source_id: str
    target_id: str
    relationship: str
    properties: Dict[str, Any]
    weight: float
    created_at: datetime


class KnowledgeQuery(BaseModel):
    """Query for knowledge graph"""
    node_type: Optional[str] = None
    node_id: Optional[str] = None
    relationships: Optional[List[str]] = None
    depth: int = Field(default=2, description="Graph traversal depth")
    limit: int = Field(default=50)


class ConsolidationRequest(BaseModel):
    """Request for memory consolidation"""
    user_id: str
    force: bool = Field(default=False, description="Force immediate consolidation")


class ConsolidationReport(BaseModel):
    """Report from consolidation"""
    user_id: str
    memories_processed: int
    memories_consolidated: int
    memories_archived: int
    memories_created: int  # New memories from consolidation
    duration_seconds: float
    timestamp: datetime


class WorkingMemory(BaseModel):
    """Working memory state"""
    user_id: str
    session_id: str
    current_context: Dict[str, Any]
    recent_memories: List[MemoryRecord]
    active_topics: List[str]
    sentiment_state: str
    created_at: datetime
    expires_at: datetime


class MemoryStats(BaseModel):
    """Statistics for user memory"""
    user_id: str
    total_memories: int
    by_type: Dict[str, int]
    by_priority: Dict[str, int]
    avg_importance: float
    avg_access_count: float
    oldest_memory: datetime
    newest_memory: datetime
    consolidation_status: str
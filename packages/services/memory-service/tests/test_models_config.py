"""
Tests for Memory service models and configuration.
"""
from datetime import datetime

import pytest
from pydantic import ValidationError

from app.config import Settings, get_settings
from app.models import (
    AgentMemory,
    AgentMemoryRequest,
    ConsolidationReport,
    ConsolidationRequest,
    KnowledgeEdge,
    KnowledgeNode,
    KnowledgeQuery,
    MemoryCreate,
    MemoryPriority,
    MemoryRecord,
    MemorySearch,
    MemorySearchResponse,
    MemorySearchResult,
    MemoryType,
)


class TestEnums:
    def test_memory_type_values(self):
        assert MemoryType.EPISODIC.value == "episodic"
        assert MemoryType.SEMANTIC.value == "semantic"
        assert MemoryType.PROCEDURAL.value == "procedural"
        assert MemoryType.CONVERSATION.value == "conversation"
        assert MemoryType.USER_PROFILE.value == "user_profile"

    def test_memory_priority_values(self):
        assert MemoryPriority.HIGH.value == "high"
        assert MemoryPriority.MEDIUM.value == "medium"
        assert MemoryPriority.LOW.value == "low"

    def test_enums_are_str(self):
        assert isinstance(MemoryType.SEMANTIC, str)
        assert MemoryPriority.HIGH == "high"


class TestMemoryCreate:
    def test_valid_create(self):
        m = MemoryCreate(
            user_id="u-1",
            memory_type=MemoryType.SEMANTIC,
            content="User prefers morning sessions",
        )
        assert m.user_id == "u-1"
        assert m.memory_type == MemoryType.SEMANTIC
        assert m.priority == MemoryPriority.MEDIUM
        assert m.metadata is None
        assert m.embedding is None

    def test_create_with_all_fields(self):
        m = MemoryCreate(
            user_id="u-1",
            memory_type=MemoryType.EPISODIC,
            content="Booked a session",
            priority=MemoryPriority.HIGH,
            source="booking-service",
            metadata={"vertical": "legal"},
            context={"channel": "web"},
            embedding=[0.1, 0.2, 0.3],
        )
        assert m.priority == MemoryPriority.HIGH
        assert m.embedding == [0.1, 0.2, 0.3]
        assert m.source == "booking-service"

    def test_missing_required_fields(self):
        with pytest.raises(ValidationError):
            MemoryCreate()

    def test_invalid_memory_type(self):
        with pytest.raises(ValidationError):
            MemoryCreate(user_id="u-1", memory_type="unknown", content="x")


class TestMemoryRecord:
    def _make(self, **overrides):
        defaults = dict(
            id="m-1",
            user_id="u-1",
            memory_type=MemoryType.SEMANTIC,
            content="content",
            metadata={},
            priority=MemoryPriority.MEDIUM,
            embedding=[0.1],
            importance_score=0.5,
            access_count=0,
            last_accessed=datetime.now(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            consolidated=False,
            source="test",
            context={},
        )
        defaults.update(overrides)
        return MemoryRecord(**defaults)

    def test_valid_record(self):
        m = self._make()
        assert m.id == "m-1"
        assert m.consolidated is False
        assert m.access_count == 0

    def test_record_requires_embedding(self):
        with pytest.raises(ValidationError):
            self._make(embedding=None)


class TestMemorySearch:
    def test_valid_search(self):
        s = MemorySearch(user_id="u-1", query="morning preference")
        assert s.top_k == 10
        assert s.similarity_threshold is None
        assert s.include_context is True
        assert s.memory_types is None

    def test_search_with_types(self):
        s = MemorySearch(
            user_id="u-1",
            query="x",
            memory_types=[MemoryType.SEMANTIC, MemoryType.EPISODIC],
            top_k=5,
            similarity_threshold=0.9,
        )
        assert len(s.memory_types) == 2
        assert s.top_k == 5
        assert s.similarity_threshold == 0.9

    def test_missing_user_id(self):
        with pytest.raises(ValidationError):
            MemorySearch(query="x")


class TestMemorySearchResponse:
    def test_response(self):
        resp = MemorySearchResponse(
            query="morning",
            results=[
                MemorySearchResult(
                    memory=MemoryRecord(
                        id="m-1",
                        user_id="u-1",
                        memory_type=MemoryType.SEMANTIC,
                        content="c",
                        metadata={},
                        priority=MemoryPriority.MEDIUM,
                        embedding=[0.1],
                        importance_score=0.5,
                        access_count=1,
                        last_accessed=datetime.now(),
                        created_at=datetime.now(),
                        updated_at=datetime.now(),
                        consolidated=False,
                        source="t",
                        context={},
                    ),
                    similarity=0.91,
                )
            ],
            total=1,
            processing_time_ms=3.2,
        )
        assert resp.total == 1
        assert resp.results[0].similarity == 0.91


class TestAgentMemoryModels:
    def test_agent_memory_request_defaults(self):
        r = AgentMemoryRequest(agent_id="a-1", context="booking flow")
        assert r.user_id is None
        assert r.session_id is None
        assert r.max_memories == 20

    def test_agent_memory(self):
        am = AgentMemory(
            agent_id="a-1",
            memory_type=MemoryType.PROCEDURAL,
            content="How to book",
            context={},
            relevance_score=0.8,
            created_at=datetime.now(),
        )
        assert am.relevance_score == 0.8


class TestKnowledgeGraphModels:
    def test_node(self):
        n = KnowledgeNode(
            id="n-1",
            type="topic",
            properties={"name": "React"},
            created_at=datetime.now(),
        )
        assert n.type == "topic"

    def test_edge(self):
        e = KnowledgeEdge(
            id="e-1",
            source_id="n-1",
            target_id="n-2",
            relationship="KNOWS",
            properties={},
            weight=0.9,
            created_at=datetime.now(),
        )
        assert e.relationship == "KNOWS"
        assert e.weight == 0.9

    def test_query_defaults(self):
        q = KnowledgeQuery()
        assert q.depth == 2
        assert q.limit == 50
        assert q.node_type is None


class TestConsolidationModels:
    def test_consolidation_request_defaults(self):
        r = ConsolidationRequest(user_id="u-1")
        assert r.force is False

    def test_consolidation_report(self):
        r = ConsolidationReport(
            user_id="u-1",
            memories_processed=100,
            memories_consolidated=40,
            memories_archived=10,
            memories_created=5,
            duration_seconds=1.5,
            timestamp=datetime.now(),
        )
        assert r.memories_processed == 100
        assert r.memories_created == 5


class TestSettings:
    def test_defaults(self):
        settings = Settings()
        assert settings.SERVER_PORT == 3008
        assert settings.REDIS_DB == 0
        assert settings.PINECONE_INDEX_NAME == "consultancy-memory"
        assert settings.NEO4J_URI == "bolt://localhost:7687"
        assert settings.MONGODB_DB_NAME == "consultancy_memory"
        assert settings.EMBEDDINGS_DIMENSION == 1536
        assert settings.MEMORY_RETENTION_DAYS == 365
        assert settings.MEMORY_SIMILARITY_THRESHOLD == 0.85
        assert settings.MEMORY_MAX_WORKING_SIZE_MB == 100

    def test_env_override(self, monkeypatch):
        monkeypatch.setenv("SERVER_PORT", "4008")
        monkeypatch.setenv("PINECONE_API_KEY", "pc-key")
        monkeypatch.setenv("MEMORY_SIMILARITY_THRESHOLD", "0.9")

        settings = Settings()
        assert settings.SERVER_PORT == 4008
        assert settings.PINECONE_API_KEY == "pc-key"
        assert settings.MEMORY_SIMILARITY_THRESHOLD == 0.9

    def test_get_settings_is_cached(self):
        assert get_settings() is get_settings()

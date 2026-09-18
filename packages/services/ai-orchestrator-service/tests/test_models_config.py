"""
Tests for AI Orchestrator service models and configuration.
"""
import os
from datetime import datetime

import pytest
from pydantic import ValidationError

from app.config import Settings, get_settings
from app.models import (
    ChatMessage,
    ChatRequest,
    MatchRequest,
    MatchResponse,
    MatchResult,
)


class TestMatchRequest:
    def test_valid_request(self):
        req = MatchRequest(
            seeker_id="user-1",
            query="I need a React developer",
        )
        assert req.seeker_id == "user-1"
        assert req.max_results == 10
        assert req.include_ai_matching is True
        assert req.verticals is None

    def test_missing_required_fields(self):
        with pytest.raises(ValidationError):
            MatchRequest()

    def test_missing_query(self):
        with pytest.raises(ValidationError):
            MatchRequest(seeker_id="user-1")

    def test_optional_fields(self):
        req = MatchRequest(
            seeker_id="user-1",
            query="startup lawyer",
            verticals=["legal"],
            budget_min=50,
            budget_max=200,
            languages=["en", "es"],
            max_results=5,
        )
        assert req.verticals == ["legal"]
        assert req.budget_min == 50
        assert req.budget_max == 200
        assert req.languages == ["en", "es"]
        assert req.max_results == 5


class TestMatchResult:
    def test_valid_result(self):
        r = MatchResult(
            consultant_id="c-1",
            score=0.92,
            reasons=["skill match"],
            profile={"name": "Jane"},
        )
        assert r.score == 0.92
        assert r.reasons == ["skill match"]
        assert r.next_available is None

    def test_score_lower_bound(self):
        r = MatchResult(
            consultant_id="c-1", score=0.0, reasons=[], profile={}
        )
        assert r.score == 0.0

    def test_score_upper_bound(self):
        r = MatchResult(
            consultant_id="c-1", score=1.0, reasons=[], profile={}
        )
        assert r.score == 1.0

    @pytest.mark.parametrize("score", [-0.1, 1.1, 2.0])
    def test_score_out_of_range(self, score):
        with pytest.raises(ValidationError):
            MatchResult(consultant_id="c-1", score=score, reasons=[], profile={})


class TestMatchResponse:
    def test_response(self):
        resp = MatchResponse(
            query="react developer",
            results=[
                MatchResult(consultant_id="c-1", score=0.9, reasons=["x"], profile={})
            ],
            total=1,
            processing_time_ms=42.5,
        )
        assert resp.total == 1
        assert resp.ai_analysis is None
        assert resp.results[0].consultant_id == "c-1"


class TestChatMessage:
    def test_valid_message(self):
        msg = ChatMessage(role="user", content="Hello")
        assert msg.role == "user"
        assert msg.content == "Hello"
        assert msg.timestamp is None

    def test_message_with_timestamp(self):
        ts = datetime.now()
        msg = ChatMessage(role="assistant", content="Hi", timestamp=ts)
        assert msg.timestamp == ts

    def test_missing_content(self):
        with pytest.raises(ValidationError):
            ChatMessage(role="user")


class TestChatRequest:
    def test_valid_request(self):
        req = ChatRequest(
            session_id="s-1",
            user_id="u-1",
            message="Book a session",
        )
        assert req.language == "en"
        assert req.history is None
        assert req.context is None

    def test_with_history(self):
        req = ChatRequest(
            session_id="s-1",
            user_id="u-1",
            message="Another message",
            history=[ChatMessage(role="user", content="First")],
        )
        assert len(req.history) == 1
        assert req.history[0].content == "First"

    def test_missing_session_id(self):
        with pytest.raises(ValidationError):
            ChatRequest(user_id="u-1", message="hi")


class TestSettings:
    def test_defaults(self):
        settings = Settings()
        assert settings.SERVER_HOST == "0.0.0.0"
        assert settings.SERVER_PORT == 3007
        assert settings.KAFKA_BROKERS == "localhost:9092"
        assert settings.MATCHING_MIN_SCORE == 0.6
        assert settings.MATCHING_MAX_RESULTS == 20
        assert settings.MATCHING_USE_AI is True
        assert settings.CHATBOT_TEMPERATURE == 0.7
        assert settings.TRANSLATION_ENABLED is True
        assert settings.LOG_LEVEL == "INFO"

    def test_env_override(self, monkeypatch):
        monkeypatch.setenv("SERVER_PORT", "4000")
        monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-test")
        monkeypatch.setenv("MATCHING_MAX_RESULTS", "50")
        monkeypatch.setenv("LOG_LEVEL", "DEBUG")

        settings = Settings()
        assert settings.SERVER_PORT == 4000
        assert settings.ANTHROPIC_API_KEY == "sk-test"
        assert settings.MATCHING_MAX_RESULTS == 50
        assert settings.LOG_LEVEL == "DEBUG"

    def test_get_settings_is_cached(self):
        # lru_cache should return the same instance
        assert get_settings() is get_settings()

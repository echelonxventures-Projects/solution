"""
Pydantic Models for API Requests and Responses
"""

from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class MatchRequest(BaseModel):
    """Request for consultant matching"""
    seeker_id: str = Field(..., description="Seeker user ID")
    query: str = Field(..., description="Natural language query describing needs")
    verticals: Optional[List[str]] = Field(default=None, description="Preferred verticals")
    budget_min: Optional[float] = Field(default=None, description="Minimum budget")
    budget_max: Optional[float] = Field(default=None, description="Maximum budget")
    languages: Optional[List[str]] = Field(default=None, description="Required languages")
    availability: Optional[Dict[str, Any]] = Field(default=None, description="Availability requirements")
    max_results: Optional[int] = Field(default=10, description="Maximum results to return")
    include_ai_matching: Optional[bool] = Field(default=True, description="Use AI for matching")


class MatchResult(BaseModel):
    """Single match result"""
    consultant_id: str
    score: float = Field(..., ge=0, le=1)
    reasons: List[str]
    profile: Dict[str, Any]
    next_available: Optional[str] = None


class MatchResponse(BaseModel):
    """Response for consultant matching"""
    query: str
    results: List[MatchResult]
    total: int
    processing_time_ms: float
    ai_analysis: Optional[str] = None


class ChatMessage(BaseModel):
    """Chat message"""
    role: str = Field(..., description="Message role: user, assistant, system")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    """Request for chatbot conversation"""
    session_id: str = Field(..., description="Chat session ID")
    user_id: str = Field(..., description="User ID")
    message: str = Field(..., description="User message")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")
    history: Optional[List[ChatMessage]] = Field(default=None, description="Conversation history")
    language: Optional[str] = Field(default="en", description="User language")


class ChatResponse(BaseModel):
    """Response from chatbot"""
    session_id: str
    response: str
    suggestions: Optional[List[str]] = None
    intent: Optional[str] = None
    confidence: Optional[float] = None
    requires_action: Optional[bool] = None
    action_type: Optional[str] = None
    action_data: Optional[Dict[str, Any]] = None


class CopilotRequest(BaseModel):
    """Request for consultant copilot assistance"""
    session_id: str = Field(..., description="Session ID")
    consultant_id: str = Field(..., description="Consultant ID")
    seeker_id: str = Field(..., description="Seeker ID")
    context: str = Field(..., description="Context for assistance")
    request_type: str = Field(..., description="Type of assistance needed")
    conversation_history: Optional[List[ChatMessage]] = Field(default=None)
    seeker_profile: Optional[Dict[str, Any]] = Field(default=None)


class CopilotResponse(BaseModel):
    """Response from consultant copilot"""
    session_id: str
    suggestions: List[str]
    talking_points: Optional[List[str]] = None
    questions_to_ask: Optional[List[str]] = None
    resources: Optional[List[Dict[str, str]]] = None
    analysis: Optional[str] = None


class TranslationRequest(BaseModel):
    """Request for translation"""
    text: str = Field(..., description="Text to translate")
    source_language: str = Field(..., description="Source language code")
    target_language: str = Field(..., description="Target language code")
    context: Optional[str] = Field(default=None, description="Translation context")


class TranslationResponse(BaseModel):
    """Response from translation"""
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    confidence: Optional[float] = None


class SentimentRequest(BaseModel):
    """Request for sentiment analysis"""
    text: str = Field(..., description="Text to analyze")
    context: Optional[str] = Field(default=None, description="Analysis context")


class SentimentResponse(BaseModel):
    """Response from sentiment analysis"""
    text: str
    sentiment: str = Field(..., description="positive, negative, neutral, mixed")
    score: float = Field(..., ge=-1, le=1, description="Sentiment score")
    emotions: Optional[Dict[str, float]] = None
    keywords: Optional[List[str]] = None


class SummarizationRequest(BaseModel):
    """Request for summarization"""
    session_id: str = Field(..., description="Session ID")
    conversation_transcript: str = Field(..., description="Full conversation transcript")
    summary_type: str = Field(default="full", description="Type of summary: full, brief, action_items")
    target_audience: str = Field(default="both", description="Target audience: consultant, seeker, both")


class SummarizationResponse(BaseModel):
    """Response from summarization"""
    session_id: str
    summary: str
    key_points: List[str]
    action_items: Optional[List[str]] = None
    follow_up_suggestions: Optional[List[str]] = None
    duration_estimate_minutes: Optional[int] = None


class IntentType(str, Enum):
    """Chatbot intent types"""
    FIND_CONSULTANT = "find_consultant"
    BOOK_SESSION = "book_session"
    GET_INFO = "get_info"
    CANCEL_BOOKING = "cancel_booking"
    GET_PRICING = "get_pricing"
    GENERAL_QUESTION = "general_question"
    COMPLAINT = "complaint"
    FEEDBACK = "feedback"
    SUPPORT = "support"
    UNKNOWN = "unknown"


class UserProfile(BaseModel):
    """User profile for AI context"""
    user_id: str
    name: str
    role: str
    preferences: Optional[Dict[str, Any]] = None
    history_summary: Optional[str] = None
    interests: Optional[List[str]] = None
    language: Optional[str] = "en"
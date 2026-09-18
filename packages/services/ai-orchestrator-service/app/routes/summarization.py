"""
API Routes for Session Summarization
"""

import json
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import SummarizationRequest, SummarizationResponse
from app.agents import AnalyzerAgent
from app.database import insert_one, update_one, query_one

logger = get_logger()
router = APIRouter()


@router.post("/", response_model=SummarizationResponse)
async def summarize_session(request: SummarizationRequest):
    """
    Generate AI summary of a session

    Types:
    - full: Comprehensive summary
    - brief: Short overview
    - action_items: Focus on action items
    """
    try:
        analyzer = AnalyzerAgent()

        result = await analyzer.generate_summary(
            transcript=request.conversation_transcript,
            target_audience=request.target_audience,
        )

        # Store summary in database
        await store_summary(
            session_id=request.session_id,
            summary=result,
            summary_type=request.summary_type,
        )

        return SummarizationResponse(
            session_id=request.session_id,
            summary=result.get("summary", ""),
            key_points=result.get("key_points", []),
            action_items=result.get("action_items"),
            follow_up_suggestions=result.get("recommendations"),
            duration_estimate_minutes=result.get("duration_estimate"),
        )

    except Exception as e:
        logger.error(f"Summarization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/realtime")
async def realtime_summary(session_id: str, recent_transcript: str):
    """
    Generate quick summary of recent conversation
    """
    from app.llm.clients import get_llm_client

    llm = get_llm_client()

    prompt = f"""Summarize this recent conversation segment in 2-3 sentences:
{recent_transcript}

Focus on the main topic and any decisions made."""

    summary = await llm.generate(
        prompt=prompt,
        temperature=0.3,
        max_tokens=256,
    )

    return {
        "session_id": session_id,
        "brief_summary": summary.strip(),
    }


@router.get("/session/{session_id}")
async def get_session_summary(session_id: str):
    """
    Get stored summary for a session
    """
    summary_record = await query_one("session_summaries", {"session_id": session_id})

    if not summary_record:
        raise HTTPException(status_code=404, detail="Summary not found")

    return {
        "session_id": session_id,
        "summary": summary_record,
    }


@router.post("/compare")
async def compare_sessions(session_ids: List[str]):
    """
    Compare summaries across multiple sessions
    """
    summaries = []

    for session_id in session_ids:
        summary_record = await query_one("session_summaries", {"session_id": session_id})
        if summary_record:
            summaries.append(summary_record)

    if not summaries:
        raise HTTPException(status_code=404, detail="No summaries found")

    # Use AI to compare
    from app.llm.clients import get_llm_client

    llm = get_llm_client()

    prompt = f"""Compare these session summaries and identify patterns:
{json.dumps(summaries, indent=2)}

Identify:
1. Common topics across sessions
2. Recurring action items
3. Progress patterns
4. Recommendations for future sessions

Return as JSON."""

    comparison = await llm.generate(
        prompt=prompt,
        temperature=0.3,
        max_tokens=1024,
    )

    try:
        return json.loads(comparison)
    except:
        return {"comparison": comparison}


@router.post("/notes/consultant")
async def generate_consultant_notes(session_id: str, transcript: str):
    """
    Generate structured notes for consultant's records
    """
    analyzer = AnalyzerAgent()

    summary = await analyzer.generate_summary(
        transcript=transcript,
        target_audience="consultant",
    )

    # Add consultant-specific formatting
    consultant_notes = {
        "session_id": session_id,
        "client_summary": summary.get("summary", ""),
        "topics_covered": summary.get("key_points", []),
        "recommendations_given": summary.get("recommendations", []),
        "next_session_preparation": summary.get("action_items", []),
        "value_delivered": summary.get("estimated_value", "medium"),
        "generated_at": datetime.utcnow(),
    }

    return consultant_notes


@router.post("/notes/seeker")
async def generate_seeker_notes(session_id: str, transcript: str):
    """
    Generate summary notes for seeker's records
    """
    analyzer = AnalyzerAgent()

    summary = await analyzer.generate_summary(
        transcript=transcript,
        target_audience="seeker",
    )

    seeker_notes = {
        "session_id": session_id,
        "session_summary": summary.get("summary", ""),
        "key_learnings": summary.get("key_points", []),
        "action_items": summary.get("action_items", []),
        "recommendations": summary.get("recommendations", []),
        "resources_mentioned": summary.get("resources", []),
        "generated_at": datetime.utcnow(),
    }

    return seeker_notes


@router.post("/transcript")
async def summarize_transcript(transcript: str, include_timestamps: bool = False):
    """
    Summarize raw transcript with optional timestamps
    """
    analyzer = AnalyzerAgent()

    result = await analyzer.analyze_conversation(transcript)

    summary = await analyzer.generate_summary(transcript)

    response = {
        "summary": summary.get("summary", ""),
        "key_topics": result.get("key_topics", []),
        "sentiment": result.get("sentiment", "neutral"),
        "action_items": result.get("action_items", []),
        "duration_estimate": estimate_duration(transcript),
    }

    if include_timestamps:
        response["timestamps"] = extract_timestamps(transcript)

    return response


async def store_summary(
    session_id: str,
    summary: dict,
    summary_type: str,
):
    """Store summary in database"""
    await insert_one("session_summaries", {
        "id": f"summary_{session_id}",
        "session_id": session_id,
        "summary_type": summary_type,
        "content": json.dumps(summary),
        "created_at": datetime.utcnow(),
    })


def estimate_duration(transcript: str) -> int:
    """Estimate session duration from transcript length"""
    # Rough estimate: ~100 words per minute of speech
    words = len(transcript.split())
    return max(1, words // 100)


def extract_timestamps(transcript: str) -> list:
    """Extract timestamps from transcript if present"""
    import re

    timestamps = []
    pattern = r'\[(\d{2}:\d{2}:\d{2})\]'

    matches = re.findall(pattern, transcript)
    for match in matches:
        timestamps.append(match)

    return timestamps
"""
API Routes for Consultant Copilot
"""

import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import CopilotRequest, CopilotResponse, ChatMessage
from app.agents import CopilotAgent
from app.database import get_consultant_with_profile, query_one

logger = get_logger()
router = APIRouter()


@router.post("/assist", response_model=CopilotResponse)
async def get_assistance(request: CopilotRequest):
    """
    Get AI assistance for consultant during session

    Provides:
    - Talking points
    - Questions to ask
    - Resources
    - Suggestions
    """
    try:
        copilot = CopilotAgent()

        # Get seeker profile if available
        seeker_profile = request.seeker_profile
        if not seeker_profile and request.seeker_id:
            seeker_profile = await query_one("users", {"id": request.seeker_id})

        # Build conversation history
        history = []
        if request.conversation_history:
            for msg in request.conversation_history:
                history.append({"role": msg.role, "content": msg.content})

        # Get assistance
        result = await copilot.get_assistance(
            context=request.context,
            request_type=request.request_type,
            conversation_history=history,
            seeker_profile=seeker_profile,
        )

        return CopilotResponse(
            session_id=request.session_id,
            suggestions=result.get("suggestions", []),
            talking_points=result.get("talking_points"),
            questions_to_ask=result.get("questions_to_ask"),
            resources=result.get("resources"),
            analysis=result.get("analysis"),
        )

    except Exception as e:
        logger.error(f"Copilot error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prepare")
async def prepare_for_session(consultant_id: str, seeker_id: str, topic: str):
    """
    Prepare talking points and questions before a session
    """
    consultant = await get_consultant_with_profile(consultant_id)
    if not consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")

    seeker = await query_one("users", {"id": seeker_id})

    copilot = CopilotAgent()

    context = f"""
Consultant: {consultant.get('name', 'Unknown')}
Expertise: {consultant.get('verticals', [])}
Skills: {consultant.get('skills', [])}

Seeker: {seeker.get('name', 'Unknown')} (if available)
Topic: {topic}

Prepare for a consultation session on the given topic.
"""

    result = await copilot.get_assistance(
        context=context,
        request_type="preparation",
        seeker_profile=seeker,
    )

    return {
        "consultant_id": consultant_id,
        "seeker_id": seeker_id,
        "topic": topic,
        "preparation": result,
    }


@router.post("/realtime")
async def realtime_suggestion(
    session_id: str,
    consultant_id: str,
    current_topic: str,
    seeker_response: Optional[str] = None,
):
    """
    Get real-time suggestions during a session
    """
    copilot = CopilotAgent()

    context = f"""
Current topic being discussed: {current_topic}
{f'Seeker just said: {seeker_response}' if seeker_response else ''}

Provide real-time suggestions for the consultant to guide the conversation effectively.
"""

    result = await copilot.get_assistance(
        context=context,
        request_type="realtime",
    )

    return {
        "session_id": session_id,
        "suggestions": result.get("suggestions", []),
        "next_questions": result.get("questions_to_ask", []),
    }


@router.post("/resources")
async def find_resources(topic: str, verticals: List[str] = None):
    """
    Find relevant resources for a topic
    """
    from app.llm.clients import get_llm_client

    llm = get_llm_client()

    prompt = f"""Topic: {topic}
Verticals: {verticals or 'General'}

Recommend relevant resources, articles, tools, or references that would be helpful for this topic.
Format as JSON with:
{"resources": [{"title": "...", "type": "...", "url": "...", "description": "..."}]}"""

    response = await llm.generate(
        prompt=prompt,
        temperature=0.5,
        max_tokens=1024,
    )

    try:
        return json.loads(response)
    except:
        return {"resources": []}


@router.post("/summary")
async def generate_session_notes(session_id: str, transcript: str):
    """
    Generate structured session notes for consultant
    """
    from app.agents import AnalyzerAgent

    analyzer = AnalyzerAgent()
    summary = await analyzer.generate_summary(
        transcript=transcript,
        target_audience="consultant",
    )

    return {
        "session_id": session_id,
        "notes": summary,
    }
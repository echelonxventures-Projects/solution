"""
API Routes for AI Chatbot
"""

import json
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import ChatRequest, ChatResponse, ChatMessage, IntentType
from app.agents import AssistantAgent
from app.database import insert_one, query_all, update_one

logger = get_logger()
router = APIRouter()


@router.post("/message", response_model=ChatResponse)
async def process_message(request: ChatRequest):
    """
    Process a chatbot message

    - Understands user intent
    - Provides contextual responses
    - Offers actionable suggestions
    """
    try:
        assistant = AssistantAgent()

        # Build history from request
        history = []
        if request.history:
            for msg in request.history:
                history.append({"role": msg.role, "content": msg.content})

        # Process message
        result = await assistant.process_message(
            user_message=request.message,
            history=history,
            context=request.context,
            language=request.language,
        )

        # Store message in database
        await store_chat_message(
            session_id=request.session_id,
            user_id=request.user_id,
            message=request.message,
            response=result["response"],
            intent=result["intent"],
        )

        # Check if action is required
        requires_action = result["intent"] in [
            IntentType.BOOK_SESSION.value,
            IntentType.FIND_CONSULTANT.value,
        ]

        action_data = None
        if requires_action:
            action_data = await extract_action_data(request.message, result["intent"])

        return ChatResponse(
            session_id=request.session_id,
            response=result["response"],
            suggestions=result.get("suggestions"),
            intent=result["intent"],
            confidence=result.get("confidence", 0.9),
            requires_action=requires_action,
            action_type=result["intent"] if requires_action else None,
            action_data=action_data,
        )

    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/history")
async def get_chat_history(session_id: str, limit: int = 50):
    """
    Get chat history for a session
    """
    messages = await query_all(
        "chat_messages",
        {"session_id": session_id},
        order_by="created_at ASC",
        limit=limit,
    )

    return {
        "session_id": session_id,
        "messages": messages,
        "total": len(messages),
    }


@router.post("/session/{session_id}/end")
async def end_chat_session(session_id: str):
    """
    End a chat session and generate summary
    """
    messages = await query_all(
        "chat_messages",
        {"session_id": session_id},
        order_by="created_at ASC",
    )

    if not messages:
        raise HTTPException(status_code=404, detail="Session not found")

    # Generate session summary
    from app.agents import AnalyzerAgent

    transcript = "\n".join([
        f"{m['role']}: {m['content']}"
        for m in messages
    ])

    analyzer = AnalyzerAgent()
    summary = await analyzer.analyze_conversation(transcript)

    # Update session status
    await update_one("chat_sessions", session_id, {
        "status": "ended",
        "ended_at": datetime.utcnow(),
        "summary": json.dumps(summary),
    })

    return {
        "session_id": session_id,
        "status": "ended",
        "summary": summary,
        "message_count": len(messages),
    }


@router.post("/intent/analyze")
async def analyze_intent(message: str):
    """
    Analyze the intent of a message without full processing
    """
    assistant = AssistantAgent()
    intent = await assistant._detect_intent(message)

    suggestions = await assistant._generate_suggestions(intent, message)

    return {
        "message": message,
        "intent": intent.value,
        "suggestions": suggestions,
    }


async def store_chat_message(
    session_id: str,
    user_id: str,
    message: str,
    response: str,
    intent: str,
):
    """Store chat message in database"""
    # Store user message
    await insert_one("chat_messages", {
        "id": f"{session_id}_user_{datetime.utcnow().timestamp()}",
        "session_id": session_id,
        "user_id": user_id,
        "role": "user",
        "content": message,
        "intent": intent,
        "created_at": datetime.utcnow(),
    })

    # Store assistant response
    await insert_one("chat_messages", {
        "id": f"{session_id}_assistant_{datetime.utcnow().timestamp()}",
        "session_id": session_id,
        "user_id": user_id,
        "role": "assistant",
        "content": response,
        "created_at": datetime.utcnow(),
    })


async def extract_action_data(message: str, intent: str) -> dict:
    """Extract actionable data from message"""
    from app.llm.clients import get_llm_client

    llm = get_llm_client()

    prompt = f"""Extract actionable data from this message for intent: {intent}

Message: {message}

Return as JSON with relevant fields for the intent.
Example for find_consultant:
{"verticals": ["..."], "skills": ["..."], "budget": {...}}

Example for book_session:
{"consultant_id": "...", "preferred_time": "..."}"""

    response = await llm.generate(
        prompt=prompt,
        temperature=0.1,
        max_tokens=256,
    )

    try:
        return json.loads(response)
    except:
        return {}
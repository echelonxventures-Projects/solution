"""
API Routes for Consultant Matching
"""

import time
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from structlog import get_logger

from app.models import MatchRequest, MatchResponse, MatchResult
from app.agents import MatcherAgent
from app.database import get_all_active_consultants

logger = get_logger()
router = APIRouter()


@router.post("/", response_model=MatchResponse)
async def find_consultants(request: MatchRequest):
    """
    Find matching consultants using AI analysis

    - Analyzes seeker's natural language query
    - Matches against consultant profiles
    - Returns ranked results with reasoning
    """
    start_time = time.time()

    try:
        matcher = MatcherAgent()

        # Use AI matching if enabled
        if request.include_ai_matching:
            results = await matcher.find_matches(
                seeker_query=request.query,
                verticals=request.verticals,
                budget_min=request.budget_min,
                budget_max=request.budget_max,
                languages=request.languages,
                max_results=request.max_results or 10,
            )
        else:
            # Use basic matching without AI
            consultants = await get_all_active_consultants()
            results = await matcher._fallback_matching(
                consultants,
                request.verticals,
                request.budget_max,
                request.languages,
                request.max_results or 10,
            )

        processing_time = (time.time() - start_time) * 1000

        # Generate AI analysis summary if AI matching was used
        ai_analysis = None
        if request.include_ai_matching and results:
            ai_analysis = f"Found {len(results)} consultants matching your requirements"

        return MatchResponse(
            query=request.query,
            results=results,
            total=len(results),
            processing_time_ms=processing_time,
            ai_analysis=ai_analysis,
        )

    except Exception as e:
        logger.error(f"Matching error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick", response_model=MatchResponse)
async def quick_match(query: str, max_results: int = 5):
    """
    Quick match with minimal parameters

    Just provide a natural language query
    """
    request = MatchRequest(
        seeker_id="anonymous",
        query=query,
        max_results=max_results,
    )
    return await find_consultants(request)


@router.get("/consultants/{consultant_id}/similar")
async def find_similar_consultants(consultant_id: str, limit: int = 5):
    """
    Find consultants similar to a given consultant
    """
    from app.database import get_consultant_with_profile

    consultant = await get_consultant_with_profile(consultant_id)
    if not consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")

    # Build query from consultant profile
    verticals = consultant.get("verticals", [])
    skills = consultant.get("skills", [])

    query = f"Consultant with expertise in {', '.join(verticals)} and skills in {', '.join(skills)}"

    matcher = MatcherAgent()
    results = await matcher.find_matches(
        seeker_query=query,
        verticals=verticals,
        max_results=limit + 1,  # Include original
    )

    # Filter out the original consultant
    similar = [r for r in results if r.consultant_id != consultant_id][:limit]

    return {
        "consultant_id": consultant_id,
        "similar_consultants": similar,
        "total": len(similar),
    }


@router.post("/explain")
async def explain_match(consultant_id: str, seeker_query: str):
    """
    Explain why a consultant matches a query
    """
    from app.database import get_consultant_with_profile

    consultant = await get_consultant_with_profile(consultant_id)
    if not consultant:
        raise HTTPException(status_code=404, detail="Consultant not found")

    # Use LLM to explain the match
    from app.llm.clients import get_llm_client, MATCHING_SYSTEM_PROMPT

    llm = get_llm_client()

    prompt = f"""Seeker Query: {seeker_query}

Consultant Profile:
{consultant}

Explain why this consultant would be a good match for this seeker.
List specific reasons and assign a match score (0-1).
Return as JSON with format:
{"score": 0.XX, "reasons": ["...", "..."], "explanation": "..."}"""

    response = await llm.generate(
        prompt=prompt,
        system_prompt=MATCHING_SYSTEM_PROMPT,
        temperature=0.3,
        max_tokens=1024,
    )

    import json
    try:
        explanation = json.loads(response)
    except:
        explanation = {"explanation": response, "score": 0.7, "reasons": []}

    return {
        "consultant_id": consultant_id,
        "query": seeker_query,
        "explanation": explanation,
    }
"""
API Routes for Sentiment Analysis
"""

import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import SentimentRequest, SentimentResponse
from app.config import settings

logger = get_logger()
router = APIRouter()


@router.post("/", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment of text

    Returns:
    - Overall sentiment (positive/negative/neutral/mixed)
    - Sentiment score (-1 to 1)
    - Emotions detected
    - Key words
    """
    if not settings.SENTIMENT_ENABLED:
        raise HTTPException(status_code=503, detail="Sentiment analysis disabled")

    try:
        from app.agents import AnalyzerAgent

        analyzer = AnalyzerAgent()
        result = await analyzer.analyze_sentiment(
            text=request.text,
            context=request.context,
        )

        # Ensure proper format
        sentiment = result.get("sentiment", "neutral")
        score = result.get("score", 0.0)
        emotions = result.get("emotions", {})
        keywords = result.get("keywords", [])

        # Normalize sentiment
        if sentiment not in ["positive", "negative", "neutral", "mixed"]:
            sentiment = "neutral"

        # Normalize score
        score = max(-1.0, min(1.0, float(score)))

        return SentimentResponse(
            text=request.text[:200] + "..." if len(request.text) > 200 else request.text,
            sentiment=sentiment,
            score=score,
            emotions=emotions,
            keywords=keywords,
        )

    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def batch_sentiment(texts: list):
    """
    Analyze sentiment for multiple texts
    """
    from app.agents import AnalyzerAgent

    analyzer = AnalyzerAgent()
    results = []

    for text in texts:
        request = SentimentRequest(text=text)
        result = await analyze_sentiment(request)
        results.append(result)

    return {
        "total": len(results),
        "results": results,
    }


@router.post("/conversation")
async def analyze_conversation_sentiment(transcript: str):
    """
    Analyze sentiment of a full conversation

    Returns overall sentiment and segment-by-segment analysis
    """
    from app.agents import AnalyzerAgent

    analyzer = AnalyzerAgent()

    # Analyze overall conversation
    overall = await analyzer.analyze_conversation(transcript, "sentiment")

    # Analyze each segment
    segments = transcript.split("\n")
    segment_analysis = []

    for segment in segments:
        if segment.strip():
            request = SentimentRequest(text=segment)
            result = await analyze_sentiment(request)
            segment_analysis.append({
                "text": segment[:50] + "...",
                "sentiment": result.sentiment,
                "score": result.score,
            })

    return {
        "overall_sentiment": overall.get("sentiment", "neutral"),
        "overall_score": overall.get("sentiment_score", 0),
        "key_emotions": overall.get("emotions", {}),
        "segment_analysis": segment_analysis[:20],  # Limit segments
        "total_segments": len(segments),
    }


@router.post("/feedback")
async def analyze_feedback(feedback_text: str, rating: Optional[int] = None):
    """
    Analyze user feedback with optional rating context
    """
    context = f"User feedback with rating {rating}/5" if rating else "User feedback"

    request = SentimentRequest(
        text=feedback_text,
        context=context,
    )

    result = await analyze_sentiment(request)

    # Calculate satisfaction correlation
    rating_sentiment_correlation = None
    if rating:
        expected_score = (rating - 3) / 2  # Map 1-5 to -1 to 1
        correlation = "aligned" if abs(result.score - expected_score) < 0.3 else "disaligned"
        rating_sentiment_correlation = correlation

    return {
        "feedback": feedback_text[:100] + "...",
        "sentiment": result.sentiment,
        "score": result.score,
        "rating": rating,
        "rating_sentiment_correlation": rating_sentiment_correlation,
        "keywords": result.keywords,
        "actionable_insights": await extract_insights(feedback_text),
    }


async def extract_insights(text: str) -> list:
    """Extract actionable insights from feedback"""
    from app.llm.clients import get_llm_client

    llm = get_llm_client()

    prompt = f"""Extract actionable insights from this feedback:
{text}

Return as a JSON list of insights."""

    response = await llm.generate(
        prompt=prompt,
        temperature=0.3,
        max_tokens=256,
    )

    try:
        return json.loads(response)
    except:
        return []
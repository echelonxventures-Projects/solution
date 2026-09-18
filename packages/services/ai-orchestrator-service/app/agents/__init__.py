"""
AI Agents for specific tasks
"""

import json
from typing import Dict, List, Any, Optional
import asyncio
from datetime import datetime
from structlog import get_logger

from app.llm.clients import get_llm_client, MATCHING_SYSTEM_PROMPT, CHATBOT_SYSTEM_PROMPT, COPILOT_SYSTEM_PROMPT
from app.database import get_all_active_consultants, get_consultant_with_profile
from app.config import settings
from app.models import MatchResult, IntentType

logger = get_logger()


class MatcherAgent:
    """Agent for matching seekers with consultants"""

    def __init__(self):
        self.llm = get_llm_client("anthropic")
        self.min_score = settings.MATCHING_MIN_SCORE

    async def find_matches(
        self,
        seeker_query: str,
        verticals: Optional[List[str]] = None,
        budget_min: Optional[float] = None,
        budget_max: Optional[float] = None,
        languages: Optional[List[str]] = None,
        max_results: int = 10,
    ) -> List[MatchResult]:
        """Find matching consultants"""

        # Get all active consultants
        consultants = await get_all_active_consultants()

        if not consultants:
            return []

        # Prepare consultant data for AI analysis
        consultant_profiles = []
        for c in consultants:
            profile = {
                "id": c["id"],
                "name": c["name"],
                "title": c.get("title", ""),
                "bio": c.get("bio", ""),
                "skills": c.get("skills", []) or [],
                "verticals": c.get("verticals", []) or [],
                "sub_verticals": c.get("sub_verticals", []) or [],
                "hourly_rate": float(c.get("hourly_rate", 0) or 0),
                "rating": float(c.get("rating", 0) or 0),
                "review_count": int(c.get("review_count", 0) or 0),
                "verified": bool(c.get("verified", False)),
                "languages": c.get("languages", []) or [],
            }
            consultant_profiles.append(profile)

        # Build AI prompt
        prompt = f"""Seeker Query: {seeker_query}

Available Consultants:
{json.dumps(consultant_profiles, indent=2)}

Constraints:
- Verticals: {verticals or 'Any'}
- Budget: ${budget_min or 0} - ${budget_max or 'unlimited'}
- Languages: {languages or 'Any'}

Analyze these consultants and select the top {max_results} best matches.
For each match, provide:
1. consultant_id
2. score (0-1)
3. reasons (list of strings explaining the match)

Return results in JSON format as:
{"matches": [{"consultant_id": "...", "score": 0.XX, "reasons": ["..."]}, ...]}

Only include matches with score >= {self.min_score}."""

        # Get AI analysis
        response = await self.llm.generate(
            prompt=prompt,
            system_prompt=MATCHING_SYSTEM_PROMPT,
            temperature=0.3,
            max_tokens=4096,
        )

        # Parse response
        try:
            result = json.loads(response)
            matches_data = result.get("matches", [])
        except json.JSONDecodeError:
            # Fallback to basic matching
            return await self._fallback_matching(
                consultants, verticals, budget_max, languages, max_results
            )

        # Build match results with full profiles
        results = []
        for match in matches_data[:max_results]:
            consultant_id = match["consultant_id"]
            full_profile = await get_consultant_with_profile(consultant_id)

            if full_profile:
                results.append(MatchResult(
                    consultant_id=consultant_id,
                    score=match["score"],
                    reasons=match["reasons"],
                    profile=full_profile,
                ))

        return results

    async def _fallback_matching(
        self,
        consultants: List[Dict],
        verticals: Optional[List[str]],
        budget_max: Optional[float],
        languages: Optional[List[str]],
        max_results: int,
    ) -> List[MatchResult]:
        """Fallback matching without AI"""
        results = []

        for c in consultants:
            score = 0.5  # Base score

            # Vertical match
            if verticals:
                c_verticals = c.get("verticals", []) or []
                overlap = len(set(verticals) & set(c_verticals))
                if overlap > 0:
                    score += 0.2 * (overlap / len(verticals))

            # Budget match
            hourly_rate = float(c.get("hourly_rate", 0) or 0)
            if budget_max and hourly_rate <= budget_max:
                score += 0.1

            # Language match
            if languages:
                c_languages = c.get("languages", []) or []
                overlap = len(set(languages) & set(c_languages))
                if overlap > 0:
                    score += 0.1

            # Rating boost
            rating = float(c.get("rating", 0) or 0)
            if rating >= 4.5:
                score += 0.1
            elif rating >= 4.0:
                score += 0.05

            # Verified boost
            if c.get("verified"):
                score += 0.05

            # Cap score at 1.0
            score = min(score, 1.0)

            if score >= self.min_score:
                results.append(MatchResult(
                    consultant_id=c["id"],
                    score=score,
                    reasons=["Fallback matching applied"],
                    profile=c,
                ))

        # Sort by score and limit
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:max_results]


class AssistantAgent:
    """Agent for chatbot assistance"""

    def __init__(self):
        self.llm = get_llm_client("anthropic")

    async def process_message(
        self,
        user_message: str,
        history: Optional[List[Dict[str, str]]] = None,
        context: Optional[Dict[str, Any]] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        """Process user message and generate response"""

        # Build conversation
        messages = history or []
        messages.append({"role": "user", "content": user_message})

        # Add context to system prompt if provided
        system_prompt = CHATBOT_SYSTEM_PROMPT
        if context:
            system_prompt += f"\n\nCurrent context: {json.dumps(context)}"

        # Generate response
        response = await self.llm.chat(
            messages=messages,
            system_prompt=system_prompt,
            temperature=settings.CHATBOT_TEMPERATURE,
            max_tokens=settings.CHATBOT_MAX_TOKENS,
        )

        # Detect intent
        intent = await self._detect_intent(user_message)

        # Generate suggestions if applicable
        suggestions = await self._generate_suggestions(intent, user_message)

        return {
            "response": response,
            "intent": intent.value,
            "suggestions": suggestions,
            "confidence": 0.9,  # Default confidence
        }

    async def _detect_intent(self, message: str) -> IntentType:
        """Detect user intent from message"""
        prompt = f"""Analyze this user message and determine the intent.
Message: "{message}"

Possible intents:
- find_consultant: User wants to find a consultant
- book_session: User wants to book a session
- get_info: User wants information about something
- cancel_booking: User wants to cancel a booking
- get_pricing: User wants pricing information
- general_question: General question
- complaint: User is complaining
- feedback: User is giving feedback
- support: User needs support
- unknown: Cannot determine intent

Return only the intent name as a single word."""

        try:
            response = await self.llm.generate(
                prompt=prompt,
                temperature=0.1,
                max_tokens=50,
            )

            intent_str = response.strip().lower()
            return IntentType(intent_str)
        except:
            return IntentType.UNKNOWN

    async def _generate_suggestions(
        self,
        intent: IntentType,
        message: str,
    ) -> List[str]:
        """Generate suggestions based on intent"""
        suggestions_map = {
            IntentType.FIND_CONSULTANT: [
                "Tell me what expertise you need",
                "What's your budget range?",
                "Any specific language requirements?",
            ],
            IntentType.BOOK_SESSION: [
                "Select a consultant first",
                "Choose your preferred time",
                "Select session duration",
            ],
            IntentType.GET_PRICING: [
                "Compare consultant rates",
                "View subscription plans",
            ],
            IntentType.GENERAL_QUESTION: [
                "Ask about our platform",
                "Learn about consultants",
            ],
        }

        return suggestions_map.get(intent, [])


class AnalyzerAgent:
    """Agent for analysis tasks"""

    def __init__(self):
        self.llm = get_llm_client("anthropic")

    async def analyze_sentiment(
        self,
        text: str,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Analyze sentiment of text"""

        analysis = await self.llm.analyze(
            content=text,
            analysis_type="sentiment",
            context=context,
        )

        return analysis

    async def analyze_conversation(
        self,
        transcript: str,
        analysis_type: str = "summary",
    ) -> Dict[str, Any]:
        """Analyze conversation transcript"""

        prompt = f"""Analyze this conversation transcript:
{transcript}

Provide analysis including:
1. key_topics: Main topics discussed
2. sentiment: Overall sentiment (positive/negative/neutral)
3. action_items: Action items identified
4. follow_ups: Recommended follow-up actions
5. satisfaction_estimate: Estimated satisfaction score (0-10)

Return as JSON."""

        response = await self.llm.generate(
            prompt=prompt,
            temperature=0.3,
            max_tokens=2048,
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"analysis": response}

    async def generate_summary(
        self,
        transcript: str,
        target_audience: str = "both",
    ) -> Dict[str, Any]:
        """Generate session summary"""

        audience_context = {
            "consultant": "Focus on what was delivered and next steps for the consultant",
            "seeker": "Focus on what was learned and recommendations for the seeker",
            "both": "Comprehensive summary for both parties",
        }

        prompt = f"""Create a {target_audience}-focused summary of this session:

{transcript}

Include:
1. summary: A concise summary (2-3 sentences)
2. key_points: Main points discussed (as a list)
3. action_items: Action items for follow-up
4. recommendations: Recommendations based on discussion
5. estimated_value: Estimated value delivered (high/medium/low)

Return as JSON."""

        response = await self.llm.generate(
            prompt=prompt,
            temperature=0.3,
            max_tokens=2048,
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {"summary": response}


class CopilotAgent:
    """Agent for consultant copilot"""

    def __init__(self):
        self.llm = get_llm_client("anthropic")

    async def get_assistance(
        self,
        context: str,
        request_type: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        seeker_profile: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Get copilot assistance"""

        prompt = f"""Context: {context}
Request Type: {request_type}

{f'Seeker Profile: {json.dumps(seeker_profile)}' if seeker_profile else ''}

{f'Conversation History: {json.dumps(conversation_history[-5:])}' if conversation_history else ''}

Provide assistance including:
1. suggestions: List of suggestions for the consultant
2. talking_points: Key talking points
3. questions_to_ask: Questions to ask the seeker
4. resources: Relevant resources or references

Return as JSON."""

        response = await self.llm.generate(
            prompt=prompt,
            system_prompt=COPILOT_SYSTEM_PROMPT,
            temperature=0.5,
            max_tokens=2048,
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "suggestions": [response],
                "talking_points": [],
                "questions_to_ask": [],
                "resources": [],
            }
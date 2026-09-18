"""
LLM Client Wrappers for Anthropic and OpenAI
"""

import asyncio
from typing import Dict, List, Optional, Any
import json
from abc import ABC, abstractmethod

import anthropic
import openai
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from structlog import get_logger

from app.config import settings

logger = get_logger()

# Client instances
anthropic_client: Optional[AsyncAnthropic] = None
openai_client: Optional[AsyncOpenAI] = None


async def init_llm_clients():
    """Initialize LLM clients"""
    global anthropic_client, openai_client

    if settings.ANTHROPIC_API_KEY:
        anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        logger.info("Anthropic client initialized")

    if settings.OPENAI_API_KEY:
        openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info("OpenAI client initialized")


class BaseLLMClient(ABC):
    """Base class for LLM clients"""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """Generate text completion"""
        pass

    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """Chat completion"""
        pass

    @abstractmethod
    async def analyze(
        self,
        content: str,
        analysis_type: str,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Analyze content"""
        pass


class AnthropicClient(BaseLLMClient):
    """Anthropic Claude client wrapper"""

    def __init__(self, model: str = "claude-3-opus-20240229"):
        self.model = model
        self.client = anthropic_client

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """Generate text using Claude"""
        if not self.client:
            raise ValueError("Anthropic client not initialized")

        try:
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt or "",
                messages=[{"role": "user", "content": prompt}],
            )

            return message.content[0].text

        except Exception as e:
            logger.error(f"Anthropic generation error: {e}")
            raise

    async def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """Chat completion using Claude"""
        if not self.client:
            raise ValueError("Anthropic client not initialized")

        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt or "",
                messages=formatted_messages,
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Anthropic chat error: {e}")
            raise

    async def analyze(
        self,
        content: str,
        analysis_type: str,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Analyze content using Claude"""
        system_prompt = f"""You are an expert analyst. Analyze the given content for {analysis_type}.
Provide your analysis in JSON format with the following structure based on the analysis type."""

        prompt = f"""Content to analyze:
{content}

{f'Context: {context}' if context else ''}

Provide your analysis in valid JSON format."""

        response = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            max_tokens=2048,
        )

        # Parse JSON response
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return {"analysis": response}


class OpenAIClient(BaseLLMClient):
    """OpenAI GPT client wrapper"""

    def __init__(self, model: str = "gpt-4-turbo-preview"):
        self.model = model
        self.client = openai_client

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """Generate text using GPT"""
        if not self.client:
            raise ValueError("OpenAI client not initialized")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"OpenAI generation error: {e}")
            raise

    async def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """Chat completion using GPT"""
        if not self.client:
            raise ValueError("OpenAI client not initialized")

        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})

        for msg in messages:
            formatted_messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=formatted_messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"OpenAI chat error: {e}")
            raise

    async def analyze(
        self,
        content: str,
        analysis_type: str,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Analyze content using GPT"""
        system_prompt = f"""You are an expert analyst. Analyze the given content for {analysis_type}.
Provide your analysis in JSON format."""

        prompt = f"""Content to analyze:
{content}

{f'Context: {context}' if context else ''}

Provide your analysis in valid JSON format."""

        response = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            max_tokens=2048,
        )

        try:
            return json.loads(response)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return {"analysis": response}


def get_llm_client(prefer: str = "anthropic") -> BaseLLMClient:
    """Get appropriate LLM client"""
    if prefer == "anthropic" and anthropic_client:
        return AnthropicClient(settings.CHATBOT_MODEL)
    elif openai_client:
        return OpenAIClient("gpt-4-turbo-preview")
    elif anthropic_client:
        return AnthropicClient(settings.CHATBOT_MODEL)
    else:
        raise ValueError("No LLM client available")


# Predefined prompt templates
MATCHING_SYSTEM_PROMPT = """You are an expert consultant matching assistant for an online consultancy platform.
Your task is to analyze seeker needs and match them with the most suitable consultants.
Consider factors like:
- Relevant expertise and verticals
- Experience and ratings
- Budget alignment
- Language compatibility
- Availability

Provide matching scores and reasoning in JSON format."""

CHATBOT_SYSTEM_PROMPT = """You are a helpful AI assistant for an online consultancy platform.
Help users find consultants, book sessions, get information, and navigate the platform.
Be friendly, professional, and efficient.
If you don't understand a request, ask clarifying questions.
Provide actionable suggestions when appropriate."""

COPILOT_SYSTEM_PROMPT = """You are an AI assistant helping consultants provide excellent service.
Provide suggestions, talking points, and resources to help consultants deliver value.
Consider the seeker's needs, context, and goals.
Be supportive and professional."""
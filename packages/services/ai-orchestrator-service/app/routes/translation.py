"""
API Routes for Translation Services
"""

import json
from typing import Optional
from fastapi import APIRouter, HTTPException
from structlog import get_logger

from app.models import TranslationRequest, TranslationResponse
from app.config import settings

logger = get_logger()
router = APIRouter()


# Language code mappings
LANGUAGE_MAP = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ja": "Japanese",
    "ko": "Korean",
    "zh": "Chinese",
    "ar": "Arabic",
    "hi": "Hindi",
    "ru": "Russian",
    "nl": "Dutch",
    "pl": "Polish",
    "tr": "Turkish",
    "vi": "Vietnamese",
    "th": "Thai",
    "id": "Indonesian",
    "ms": "Malay",
    "uk": "Ukrainian",
}


@router.post("/", response_model=TranslationResponse)
async def translate(request: TranslationRequest):
    """
    Translate text between languages

    Uses AI for high-quality translation with context awareness
    """
    if not settings.TRANSLATION_ENABLED:
        raise HTTPException(status_code=503, detail="Translation service disabled")

    try:
        from app.llm.clients import get_llm_client

        llm = get_llm_client()

        source_lang_name = LANGUAGE_MAP.get(request.source_language, request.source_language)
        target_lang_name = LANGUAGE_MAP.get(request.target_language, request.target_language)

        prompt = f"""Translate the following text from {source_lang_name} to {target_lang_name}.

{f'Context: {request.context}' if request.context else ''}

Original text:
{request.text}

Provide only the translated text, nothing else.
If the text contains technical or domain-specific terms, maintain accuracy.
Preserve formatting and structure."""

        translated = await llm.generate(
            prompt=prompt,
            temperature=0.3,
            max_tokens=len(request.text) * 2 + 256,
        )

        return TranslationResponse(
            original_text=request.text,
            translated_text=translated.strip(),
            source_language=request.source_language,
            target_language=request.target_language,
            confidence=0.95,  # AI translation confidence
        )

    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch")
async def batch_translate(texts: list, source_language: str, target_language: str):
    """
    Translate multiple texts at once
    """
    results = []

    for text in texts:
        request = TranslationRequest(
            text=text,
            source_language=source_language,
            target_language=target_language,
        )
        result = await translate(request)
        results.append(result)

    return {
        "total": len(results),
        "translations": results,
    }


@router.post("/detect")
async def detect_language(text: str):
    """
    Detect the language of text
    """
    from app.llm.clients import get_llm_client

    llm = get_llm_client()

    prompt = f"""Detect the language of this text and return only the ISO language code (e.g., en, es, fr, de):

{text}"""

    detected = await llm.generate(
        prompt=prompt,
        temperature=0.1,
        max_tokens=10,
    )

    lang_code = detected.strip().lower()

    return {
        "text": text[:100] + "..." if len(text) > 100 else text,
        "detected_language": lang_code,
        "language_name": LANGUAGE_MAP.get(lang_code, "Unknown"),
    }


@router.get("/languages")
async def get_supported_languages():
    """
    Get list of supported languages
    """
    return {
        "languages": LANGUAGE_MAP,
        "total": len(LANGUAGE_MAP),
    }


@router.post("/session")
async def translate_session(
    session_id: str,
    transcript: str,
    source_language: str,
    target_language: str,
):
    """
    Translate entire session transcript
    """
    # Split transcript into segments
    segments = transcript.split("\n")

    translated_segments = []
    for segment in segments:
        if segment.strip():
            request = TranslationRequest(
                text=segment,
                source_language=source_language,
                target_language=target_language,
                context="consultancy session transcript",
            )
            result = await translate(request)
            translated_segments.append(result.translated_text)

    full_translation = "\n".join(translated_segments)

    return {
        "session_id": session_id,
        "original_language": source_language,
        "translated_language": target_language,
        "translated_transcript": full_translation,
        "segment_count": len(translated_segments),
    }
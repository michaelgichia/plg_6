"""
OpenAI API service for chat completions
"""
import asyncio
from collections.abc import AsyncGenerator
from typing import List, Dict, Any

from app.api.routes.documents import async_openai_client
from app.services.chat_utils import count_tokens


async def stream_cached_response(response: str) -> AsyncGenerator[str, None]:
    """Stream a cached response with realistic timing"""
    for char in response:
        yield char
        # Small delay to simulate streaming (faster for cached responses)
        await asyncio.sleep(0.005)


async def generate_openai_response(
    messages: List[Dict[str, str]],
    model: str = "gpt-4",
    temperature: float = 0.7,
    max_tokens: int = 1000
) -> AsyncGenerator[str, None]:
    """
    Generate streaming response from OpenAI
    
    Args:
        messages: List of message dictionaries with 'role' and 'content'
        model: OpenAI model to use
        temperature: Response randomness (0.0-1.0)
        max_tokens: Maximum tokens in response
        
    Yields:
        Content chunks as they arrive from OpenAI
    """
    try:
        # Log token usage for monitoring
        total_tokens = sum(count_tokens(str(msg["content"])) for msg in messages)
        print(f"Chat context tokens: {total_tokens}")

        # Stream response from OpenAI
        completion = await async_openai_client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        async for chunk in completion:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                yield content
            
            # Check if response was truncated (stream ended due to token limit)
            if chunk.choices[0].finish_reason == "length":
                yield "\n\n[Response was truncated. Ask me to continue for more details.]"

    except Exception as e:
        yield f"Error generating response: {str(e)}"
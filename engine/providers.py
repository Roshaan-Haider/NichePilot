"""LLM provider with primary + fallback support."""
import logging
import os
from dataclasses import dataclass
from typing import Any, Generator

from openai import OpenAI, APIError, APITimeoutError, RateLimitError

logger = logging.getLogger(__name__)

FRIENDLY_ERROR = "I'm having a brief technical issue. Could you please try again in a moment?"


@dataclass
class ProviderInfo:
    """Info about the active provider for UI display."""

    name: str
    model: str
    is_fallback: bool = False


def _get_client(prefix: str) -> tuple[OpenAI | None, str]:
    """Create an OpenAI client from env vars with given prefix (PRIMARY or FALLBACK)."""
    base_url = os.environ.get(f"{prefix}_BASE_URL")
    api_key = os.environ.get(f"{prefix}_API_KEY")
    model = os.environ.get(f"{prefix}_MODEL", "")
    if not base_url or not api_key:
        return None, model
    client = OpenAI(base_url=base_url, api_key=api_key, timeout=30.0)
    return client, model


def get_active_provider_info() -> ProviderInfo:
    """Return info about which provider is configured (for UI display)."""
    primary_model = os.environ.get("PRIMARY_MODEL", "not configured")
    primary_url = os.environ.get("PRIMARY_BASE_URL", "")
    # Extract provider name from URL
    name = "Unknown"
    if "groq" in primary_url.lower():
        name = "Groq"
    elif "google" in primary_url.lower() or "gemini" in primary_url.lower():
        name = "Gemini"
    elif "openai" in primary_url.lower():
        name = "OpenAI"
    elif primary_url:
        name = primary_url.split("//")[-1].split("/")[0].split(".")[0].title()
    return ProviderInfo(name=name, model=primary_model)


def stream_chat(
    messages: list[dict[str, Any]],
    tools: list[dict] | None = None,
    temperature: float = 0.2,
    max_tokens: int = 250,
) -> Generator[dict[str, Any], None, None]:
    """Stream a chat completion. Yields dicts with keys:

    - ``{"type": "text", "content": str}``       — text delta
    - ``{"type": "tool_call", "tool_call": dict}`` — accumulated tool call (yielded once complete)
    - ``{"type": "error", "content": str}``       — friendly error message

    Tries primary provider first; on error/timeout/rate-limit retries ONCE on fallback.
    """
    for attempt, prefix in enumerate(["PRIMARY", "FALLBACK"]):
        client, model = _get_client(prefix)
        if client is None:
            if attempt == 0:
                continue  # no primary, try fallback
            else:
                yield {"type": "error", "content": FRIENDLY_ERROR}
                return

        try:
            kwargs: dict[str, Any] = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True,
            }
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"

            response = client.chat.completions.create(**kwargs)

            # Accumulate tool calls across chunks
            tool_calls_acc: dict[int, dict] = {}

            for chunk in response:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta is None:
                    continue

                # Text content
                if delta.content:
                    yield {"type": "text", "content": delta.content}

                # Tool calls
                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in tool_calls_acc:
                            tool_calls_acc[idx] = {
                                "id": tc.id or "",
                                "function": {"name": "", "arguments": ""},
                            }
                        if tc.id:
                            tool_calls_acc[idx]["id"] = tc.id
                        if tc.function:
                            if tc.function.name:
                                tool_calls_acc[idx]["function"]["name"] += tc.function.name
                            if tc.function.arguments:
                                tool_calls_acc[idx]["function"]["arguments"] += tc.function.arguments

                # Check finish reason
                finish = chunk.choices[0].finish_reason if chunk.choices else None
                if finish == "tool_calls":
                    for idx in sorted(tool_calls_acc.keys()):
                        yield {"type": "tool_call", "tool_call": tool_calls_acc[idx]}
                    tool_calls_acc = {}

            # If there are remaining accumulated tool calls (some providers don't send finish_reason=tool_calls)
            if tool_calls_acc:
                for idx in sorted(tool_calls_acc.keys()):
                    yield {"type": "tool_call", "tool_call": tool_calls_acc[idx]}

            return  # success, exit

        except (APIError, APITimeoutError, RateLimitError) as e:
            logger.warning(f"{prefix} provider failed: {e}")
            if attempt == 0:
                continue  # try fallback
            yield {"type": "error", "content": FRIENDLY_ERROR}
            return
        except Exception as e:
            logger.warning(f"{prefix} provider unexpected error: {e}")
            if attempt == 0:
                continue
            yield {"type": "error", "content": FRIENDLY_ERROR}
            return

    # Both None
    yield {"type": "error", "content": FRIENDLY_ERROR}

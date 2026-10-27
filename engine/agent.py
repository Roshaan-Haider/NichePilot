"""Core agent – orchestrates prompt, LLM, and tools."""
import json
import logging
from typing import Any, Generator

from engine.config_loader import NicheConfig
from engine.prompts import build_system_prompt
from engine.providers import stream_chat
from engine.session import Session
from engine.tools import execute_tool, get_tool_schemas

logger = logging.getLogger(__name__)

MAX_TOOL_ROUNDS = 3


def reply(
    session: Session,
    config: NicheConfig,
    user_message: str,
) -> Generator[dict[str, Any], None, None]:
    """Process a user message and yield response events.

    Yields dicts:
      - ``{"type": "text", "content": str}``         — streamed text delta
      - ``{"type": "tool_status", "message": str}``   — UI status for tool execution
      - ``{"type": "error", "content": str}``         — error message
    """
    # Add user message to session
    session.add_message("user", user_message)

    # Build messages with system prompt
    system_prompt = build_system_prompt(config)
    messages = [{"role": "system", "content": system_prompt}] + session.get_messages()

    tools = get_tool_schemas(config)

    full_response = ""

    for tool_round in range(MAX_TOOL_ROUNDS):
        tool_calls_in_round: list[dict] = []
        round_text = ""

        for event in stream_chat(messages, tools=tools):
            if event["type"] == "text":
                round_text += event["content"]
                yield event
            elif event["type"] == "tool_call":
                tool_calls_in_round.append(event["tool_call"])
            elif event["type"] == "error":
                yield event
                session.add_message("assistant", event["content"])
                return

        if not tool_calls_in_round:
            # No tool calls — we're done
            full_response += round_text
            session.add_message("assistant", full_response)
            return

        # Process tool calls
        full_response += round_text

        # Add assistant message with tool calls to messages
        assistant_msg: dict[str, Any] = {"role": "assistant", "content": round_text or None}
        assistant_msg["tool_calls"] = [
            {
                "id": tc["id"],
                "type": "function",
                "function": {
                    "name": tc["function"]["name"],
                    "arguments": tc["function"]["arguments"],
                },
            }
            for tc in tool_calls_in_round
        ]
        messages.append(assistant_msg)

        for tc in tool_calls_in_round:
            func_name = tc["function"]["name"]
            try:
                args = json.loads(tc["function"]["arguments"])
            except json.JSONDecodeError:
                args = {}

            # Yield UI status
            status_messages = {
                "search_catalog": "🔍 Searching listings...",
                "save_lead": "💾 Saving lead...",
                "handoff_to_human": "🤝 Handing off to a human...",
            }
            yield {"type": "tool_status", "message": status_messages.get(func_name, f"Running {func_name}...")}

            # Execute tool
            result = execute_tool(func_name, args, config, session.session_id)

            # Track tool event in session
            session.tool_events.append({"tool": func_name, "result": result})

            # Add tool result to messages
            messages.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "content": result,
            })

            # Post-execution status
            if func_name == "save_lead":
                result_data = json.loads(result)
                if result_data.get("success"):
                    yield {"type": "tool_status", "message": "✅ Lead saved!"}
            elif func_name == "handoff_to_human":
                yield {"type": "tool_status", "message": "✅ Human agent notified!"}

    # If we exhausted tool rounds, add what we have
    if full_response:
        session.add_message("assistant", full_response)

"""FastAPI channel – minimal POST /chat endpoint."""
import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel

from engine.config_loader import load_niche, list_niches_with_catalog
from engine.session import SessionManager
from engine.agent import reply

app = FastAPI(title="NichePilot API", version="0.1.0")
session_mgr = SessionManager()


class ChatRequest(BaseModel):
    """Chat request body."""

    session_id: str | None = None
    niche: str = "real_estate"
    message: str


class ChatResponse(BaseModel):
    """Chat response body."""

    session_id: str
    reply: str
    tool_events: list[dict] = []


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    """Handle a chat message. Creates a session if none provided."""
    niches = list_niches_with_catalog()
    if req.niche not in niches:
        return ChatResponse(
            session_id="",
            reply=f"Niche '{req.niche}' not found or has no catalog.",
            tool_events=[],
        )

    config = load_niche(req.niche)

    # Get or create session
    session = None
    if req.session_id:
        session = session_mgr.get_session(req.session_id)
    if session is None:
        session = session_mgr.create_session(req.niche)

    # Collect full response (non-streaming for simplicity)
    full_reply = ""
    tool_events: list[dict] = []
    for event in reply(session, config, req.message):
        if event["type"] == "text":
            full_reply += event["content"]
        elif event["type"] == "tool_status":
            tool_events.append(event)
        elif event["type"] == "error":
            full_reply = event["content"]

    return ChatResponse(
        session_id=session.session_id,
        reply=full_reply,
        tool_events=tool_events,
    )

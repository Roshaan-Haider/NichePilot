"""In-memory session manager for NichePilot."""
import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Session:
    """A single chat session."""

    session_id: str
    niche_name: str
    messages: list[dict[str, Any]] = field(default_factory=list)
    tool_events: list[dict[str, str]] = field(default_factory=list)

    def add_message(self, role: str, content: str, **kwargs: Any) -> None:
        """Append a message to history."""
        msg: dict[str, Any] = {"role": role, "content": content}
        msg.update(kwargs)
        self.messages.append(msg)

    def get_messages(self) -> list[dict[str, Any]]:
        """Return full message history."""
        return self.messages.copy()


class SessionManager:
    """Manages chat sessions in memory."""

    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}

    def create_session(self, niche_name: str) -> Session:
        """Create and return a new session."""
        sid = uuid.uuid4().hex[:12]
        session = Session(session_id=sid, niche_name=niche_name)
        self._sessions[sid] = session
        return session

    def get_session(self, session_id: str) -> Session | None:
        """Get session by ID, or None."""
        return self._sessions.get(session_id)

    def delete_session(self, session_id: str) -> None:
        """Remove a session."""
        self._sessions.pop(session_id, None)

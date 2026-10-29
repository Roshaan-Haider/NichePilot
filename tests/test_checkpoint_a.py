"""Tests for Checkpoint A: Multi-niche, multi-channel backend."""
import json
import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from engine.channels.api import app as api_app, _rate_limits
from engine.channels.whatsapp_stub import app as wa_app
from engine.config_loader import load_niche
from engine.runtime import (
    DEFAULT_RUNTIME,
    get_active_niche,
    get_runtime,
    is_channel_enabled,
    save_runtime,
    update_runtime,
)
from engine.session import Session, SessionManager
from engine.agent import reply


@pytest.fixture(autouse=True)
def reset_runtime(tmp_path, monkeypatch):
    """Ensure runtime.json is redirected to a temporary location for tests."""
    temp_runtime_file = tmp_path / "runtime.json"
    monkeypatch.setattr("engine.runtime.RUNTIME_FILE", temp_runtime_file)
    monkeypatch.setattr("engine.runtime.DATA_DIR", tmp_path)
    # Clear rate limits
    _rate_limits.clear()
    save_runtime(DEFAULT_RUNTIME)


@pytest.fixture
def api_client():
    return TestClient(api_app)


@pytest.fixture
def wa_client():
    return TestClient(wa_app)


# --- 1. Runtime & Config Tests ---

def test_runtime_defaults_and_update():
    """Verify runtime.json is created with defaults and can be updated safely."""
    rt = get_runtime()
    assert rt["active_niche"] == "real_estate"
    assert rt["channels"]["web"] is True
    assert rt["channels"]["whatsapp"] is False
    assert rt["channels"]["instagram"] is False

    update_runtime(active_niche="custom_furniture", channels={"whatsapp": True})
    updated = get_runtime()
    assert updated["active_niche"] == "custom_furniture"
    assert updated["channels"]["whatsapp"] is True
    assert updated["channels"]["web"] is True


def test_real_estate_config_theme_and_greeting():
    """Check that real_estate config has greeting, suggestions, and theme."""
    cfg = load_niche("real_estate")
    assert cfg.greeting
    assert len(cfg.suggestions) > 0
    assert "colors" in cfg.theme
    assert "fonts" in cfg.theme
    assert "hero_image" in cfg.theme
    assert "headline" in cfg.theme
    assert "subtext" in cfg.theme
    assert "nav" in cfg.theme
    assert "brand_mark" in cfg.theme


# --- 2. Niche Routing & Catalog Status Tests ---

def test_get_niches_endpoint(api_client):
    """GET /niches returns status 'ready' for real_estate and 'coming_soon' for others."""
    resp = api_client.get("/niches")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    niche_map = {n["name"]: n for n in data}
    assert "real_estate" in niche_map
    assert niche_map["real_estate"]["status"] == "ready"
    assert "custom_furniture" in niche_map
    assert niche_map["custom_furniture"]["status"] == "coming_soon"


def test_get_niche_detail_endpoint(api_client):
    """GET /niche/{name} returns theme, greeting, suggestions."""
    resp = api_client.get("/niche/real_estate")
    assert resp.status_code == 200
    data = resp.json()
    assert data["business_name"] == "Sample Properties Dubai"
    assert "greeting" in data
    assert "suggestions" in data
    assert "theme" in data

    # 404 for non-existent niche
    bad_resp = api_client.get("/niche/nonexistent_niche_xyz")
    assert bad_resp.status_code == 404


# --- 3. Channel Flags (Web & WhatsApp) & Admin Runtime ---

def test_web_channel_flag_off_rejects(api_client):
    """POST /chat rejects with 403 when web channel is disabled."""
    update_runtime(channels={"web": False})
    resp = api_client.post("/chat", json={"message": "Hello"})
    assert resp.status_code == 403
    assert "disabled" in resp.json()["detail"].lower()


def test_whatsapp_channel_flag_off_and_on(wa_client):
    """WhatsApp stub rejects with 403 when disabled, accepts when enabled."""
    update_runtime(channels={"whatsapp": False})
    resp = wa_client.post("/webhook", json={"phone": "+971501234567", "message": "Hi"})
    assert resp.status_code == 403

    update_runtime(channels={"whatsapp": True})

    def fake_stream(*args, **kwargs):
        yield {"type": "text", "content": "Hello from WhatsApp!"}

    with patch("engine.channels.whatsapp_stub.reply") as mock_reply:
        mock_reply.return_value = [{"type": "text", "content": "Hello from WhatsApp!"}]
        resp2 = wa_client.post("/webhook", json={"phone": "+971501234567", "message": "Hi"})
        assert resp2.status_code == 200
        assert resp2.json()["status"] == "ok"
        assert resp2.json()["phone"] == "+971501234567"
        assert resp2.json()["reply"] == "Hello from WhatsApp!"


def test_admin_runtime_endpoint(api_client, monkeypatch):
    """POST /admin/runtime requires ADMIN_TOKEN and updates settings."""
    monkeypatch.setenv("ADMIN_TOKEN", "secret-test-token-123")

    # Unauthorized without token
    unauth = api_client.post("/admin/runtime", json={"active_niche": "dentist"})
    assert unauth.status_code == 401

    # Authorized with Bearer token
    headers = {"Authorization": "Bearer secret-test-token-123"}
    auth_resp = api_client.post(
        "/admin/runtime",
        json={"active_niche": "dentist", "channels": {"whatsapp": True}},
        headers=headers,
    )
    assert auth_resp.status_code == 200
    assert auth_resp.json()["active_niche"] == "dentist"
    assert auth_resp.json()["channels"]["whatsapp"] is True


def test_health_endpoint(api_client):
    """GET /health returns status ok."""
    resp = api_client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# --- 4. Session Isolation Across Niches ---

def test_session_isolation_across_niches():
    """Sessions for same user in different niches have isolated histories."""
    mgr = SessionManager()
    session_re = mgr.get_or_create_session("web", "user_42", "real_estate")
    session_cf = mgr.get_or_create_session("web", "user_42", "custom_furniture")

    assert session_re is not session_cf
    assert session_re.session_id != session_cf.session_id

    session_re.add_message("user", "Looking for a penthouse in Marina")
    session_cf.add_message("user", "Need a walnut dining table")

    assert len(session_re.messages) == 1
    assert "penthouse" in session_re.messages[0]["content"]

    assert len(session_cf.messages) == 1
    assert "walnut" in session_cf.messages[0]["content"]

    # Retrieval preserves isolation
    re_retrieved = mgr.get_session("web", "user_42", "real_estate")
    cf_retrieved = mgr.get_session("web", "user_42", "custom_furniture")
    assert re_retrieved is session_re
    assert cf_retrieved is session_cf


# --- 5. SSE Format & Tool Events ---

def test_sse_streaming_format(api_client):
    """POST /chat streams SSE with event: token, tool, and done."""
    def fake_reply(session, niche, message):
        yield {"type": "tool_status", "message": "🔍 Searching listings..."}
        yield {"type": "text", "content": "I found 2 available properties."}

    with patch("engine.channels.api.reply", side_effect=fake_reply):
        resp = api_client.post(
            "/chat",
            json={"session_id": "test_sse_user", "message": "Show apartments", "niche": "real_estate"},
        )
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers["content-type"]

        body = resp.text
        # Check event lines
        assert "event: tool\n" in body
        assert "event: token\n" in body
        assert "event: done\n" in body

        # Check data payloads
        assert '"tool": "search"' in body
        assert "I found 2 available properties." in body
        assert '"session_id":' in body


# --- 6. Rate Limit & Message Length Cap ---

def test_message_length_cap(api_client):
    """POST /chat rejects messages longer than 500 characters with 400."""
    long_message = "A" * 501
    resp = api_client.post("/chat", json={"message": long_message})
    assert resp.status_code == 400
    assert "500 characters" in resp.json()["detail"]


def test_per_session_rate_limit(api_client):
    """POST /chat rejects with 429 when exceeding 20 requests per minute."""
    def fake_reply(session, niche, message):
        yield {"type": "text", "content": "ok"}

    with patch("engine.channels.api.reply", side_effect=fake_reply):
        # 20 requests should succeed
        for i in range(20):
            res = api_client.post(
                "/chat",
                json={"session_id": "rate_limited_session", "message": f"msg {i}"},
            )
            assert res.status_code == 200, f"Request {i} failed with {res.status_code}"

        # 21st request should be rejected with 429
        rejected = api_client.post(
            "/chat",
            json={"session_id": "rate_limited_session", "message": "msg 21"},
        )
        assert rejected.status_code == 429
        assert "Rate limit exceeded" in rejected.json()["detail"]


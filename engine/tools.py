"""Tool definitions and executors for NichePilot."""
import csv
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from engine.config_loader import NicheConfig
from engine.notify import send_telegram

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def get_tool_schemas(config: NicheConfig) -> list[dict]:
    """Return OpenAI function-calling tool schemas for the active niche."""
    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_catalog",
                "description": f"Search the {config.business_name} catalog/listings. Returns matching items. Filters are optional.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "area": {"type": "string", "description": "Area or location to filter by"},
                        "bedrooms": {"type": "integer", "description": "Number of bedrooms"},
                        "max_price_aed": {"type": "number", "description": "Maximum price in AED"},
                        "min_price_aed": {"type": "number", "description": "Minimum price in AED"},
                        "listing_type": {"type": "string", "enum": ["sale", "rent"], "description": "Type of listing"},
                    },
                    "required": [],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "save_lead",
                "description": "Save visitor contact details as a lead. Call this when the visitor provides their name and phone number.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Visitor's full name"},
                        "phone": {"type": "string", "description": "Visitor's phone number"},
                        "email": {"type": "string", "description": "Visitor's email (optional)"},
                        "interest_summary": {"type": "string", "description": "Brief summary of what the visitor is looking for"},
                    },
                    "required": ["name", "phone"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "handoff_to_human",
                "description": "Hand off the conversation to a human agent. Use when the visitor's request cannot be answered from the catalog/FAQ, or when they explicitly ask to speak to someone.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "reason": {"type": "string", "description": "Reason for handoff"},
                    },
                    "required": ["reason"],
                },
            },
        },
    ]
    return tools


def execute_tool(tool_name: str, args: dict[str, Any], config: NicheConfig, session_id: str) -> str:
    """Execute a tool call and return the result as a string."""
    if tool_name == "search_catalog":
        return _search_catalog(args, config)
    elif tool_name == "save_lead":
        return _save_lead(args, config, session_id)
    elif tool_name == "handoff_to_human":
        return _handoff_to_human(args, config, session_id)
    else:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})


def _search_catalog(filters: dict[str, Any], config: NicheConfig) -> str:
    """Filter catalog.json by provided fields. Only returns available items by default."""
    results = [item for item in config.catalog if item.get("status", "available") == "available"]

    area = filters.get("area")
    if area:
        results = [r for r in results if area.lower() in r.get("area", "").lower()]

    bedrooms = filters.get("bedrooms")
    if bedrooms is not None:
        results = [r for r in results if r.get("bedrooms") == bedrooms]

    max_price = filters.get("max_price_aed")
    if max_price is not None:
        results = [r for r in results if r.get("price_aed", 0) <= max_price]

    min_price = filters.get("min_price_aed")
    if min_price is not None:
        results = [r for r in results if r.get("price_aed", 0) >= min_price]

    listing_type = filters.get("listing_type")
    if listing_type:
        results = [r for r in results if r.get("type", "").lower() == listing_type.lower()]

    if not results:
        return json.dumps({"results": [], "message": "No matching listings found."})
    return json.dumps({"results": results, "count": len(results)})


def _validate_phone(phone: str) -> bool:
    """Loosely validate phone: digits, +, spaces, dashes; min 7 digit chars."""
    digits = re.sub(r"[^\d]", "", phone)
    allowed = re.match(r'^[\d\s\+\-\(\)]+$', phone)
    return bool(allowed) and len(digits) >= 7


def _save_lead(fields: dict[str, Any], config: NicheConfig, session_id: str) -> str:
    """Validate and save lead to data/leads.csv."""
    name = fields.get("name", "").strip()
    phone = fields.get("phone", "").strip()
    email = fields.get("email", "").strip()
    interest = fields.get("interest_summary", "").strip()

    if not name:
        return json.dumps({"success": False, "error": "Name is required."})
    if not phone or not _validate_phone(phone):
        return json.dumps({"success": False, "error": "Please provide a valid phone number (at least 7 digits)."})

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = DATA_DIR / "leads.csv"
    file_exists = csv_path.exists()

    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp", "session_id", "niche", "name", "phone", "email", "interest_summary"])
        writer.writerow([
            datetime.now(timezone.utc).isoformat(),
            session_id,
            config.name,
            name,
            phone,
            email,
            interest,
        ])

    # Telegram notification
    msg = f"🏠 New Lead ({config.business_name})\nName: {name}\nPhone: {phone}\nEmail: {email}\nInterest: {interest}"
    send_telegram(msg)

    return json.dumps({"success": True, "message": f"Lead saved for {name}."})


def _handoff_to_human(args: dict[str, Any], config: NicheConfig, session_id: str) -> str:
    """Log handoff to data/handoffs.csv and notify via Telegram."""
    reason = args.get("reason", "No reason provided")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = DATA_DIR / "handoffs.csv"
    file_exists = csv_path.exists()

    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["timestamp", "session_id", "niche", "reason"])
        writer.writerow([
            datetime.now(timezone.utc).isoformat(),
            session_id,
            config.name,
            reason,
        ])

    msg = f"🔔 Handoff Request ({config.business_name})\nSession: {session_id}\nReason: {reason}"
    send_telegram(msg)

    return json.dumps({"success": True, "message": "A human agent has been notified and will follow up shortly."})

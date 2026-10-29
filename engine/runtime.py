"""Runtime configuration manager for NichePilot.

Manages data/runtime.json for multi-niche selection and channel activation.
"""
import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RUNTIME_FILE = DATA_DIR / "runtime.json"

DEFAULT_RUNTIME: dict[str, Any] = {
    "active_niche": "real_estate",
    "channels": {
        "web": True,
        "whatsapp": False,
        "instagram": False,
    },
}


def get_runtime() -> dict[str, Any]:
    """Read data/runtime.json, creating it with defaults if missing."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not RUNTIME_FILE.exists():
        save_runtime(DEFAULT_RUNTIME)
        return json.loads(json.dumps(DEFAULT_RUNTIME))

    try:
        with open(RUNTIME_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError("runtime.json is not a dict")
        # Ensure required keys exist
        if "active_niche" not in data:
            data["active_niche"] = DEFAULT_RUNTIME["active_niche"]
        if "channels" not in data or not isinstance(data["channels"], dict):
            data["channels"] = json.loads(json.dumps(DEFAULT_RUNTIME["channels"]))
        else:
            for ch, default_val in DEFAULT_RUNTIME["channels"].items():
                if ch not in data["channels"]:
                    data["channels"][ch] = default_val
        return data
    except Exception as exc:
        logger.warning(f"Error reading {RUNTIME_FILE}: {exc}. Resetting to defaults.")
        save_runtime(DEFAULT_RUNTIME)
        return json.loads(json.dumps(DEFAULT_RUNTIME))


def save_runtime(data: dict[str, Any]) -> dict[str, Any]:
    """Write data to data/runtime.json safely."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temp_file = RUNTIME_FILE.with_suffix(".tmp")
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    temp_file.replace(RUNTIME_FILE)
    return data


def update_runtime(
    active_niche: str | None = None,
    channels: dict[str, bool] | None = None,
) -> dict[str, Any]:
    """Update active_niche and/or channel flags."""
    current = get_runtime()
    if active_niche is not None:
        current["active_niche"] = str(active_niche)
    if channels is not None:
        if "channels" not in current or not isinstance(current["channels"], dict):
            current["channels"] = {}
        for ch, val in channels.items():
            current["channels"][ch] = bool(val)
    return save_runtime(current)


def is_channel_enabled(channel: str) -> bool:
    """Return whether a given channel is active."""
    return bool(get_runtime().get("channels", {}).get(channel, False))


def get_active_niche() -> str:
    """Return the currently configured active niche."""
    return str(get_runtime().get("active_niche", "real_estate"))


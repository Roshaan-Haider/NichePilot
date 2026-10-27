"""Niche configuration loader for NichePilot."""
import json
from dataclasses import dataclass, field
from pathlib import Path

import yaml

NICHES_DIR = Path(__file__).resolve().parent.parent / "niches"


@dataclass
class NicheConfig:
    """Configuration and data for a single niche."""

    name: str
    business_name: str
    tagline: str
    tone: str
    language_default: str
    qualifying_questions: list[str] = field(default_factory=list)
    lead_fields: list[str] = field(default_factory=list)
    hard_rules: list[str] = field(default_factory=list)
    handoff_triggers: list[str] = field(default_factory=list)
    catalog_fields: list[str] | None = None
    catalog: list[dict] = field(default_factory=list)
    faq: list[dict] = field(default_factory=list)


def list_niches() -> list[str]:
    """Scan niches/ directory and return folder names that contain a config.yaml."""
    if not NICHES_DIR.is_dir():
        return []
    return sorted(
        d.name
        for d in NICHES_DIR.iterdir()
        if d.is_dir() and (d / "config.yaml").exists()
    )


def list_niches_with_catalog() -> list[str]:
    """Scan niches/ directory and return folder names that contain BOTH config.yaml AND catalog.json."""
    if not NICHES_DIR.is_dir():
        return []
    return sorted(
        d.name
        for d in NICHES_DIR.iterdir()
        if d.is_dir()
        and (d / "config.yaml").exists()
        and (d / "catalog.json").exists()
    )


def load_niche(name: str) -> NicheConfig:
    """Load config.yaml, catalog.json, and faq.json from niches/{name}/."""
    niche_dir = NICHES_DIR / name

    config_path = niche_dir / "config.yaml"
    if not config_path.exists():
        raise FileNotFoundError(f"config.yaml not found for niche '{name}'")

    with open(config_path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    # Load catalog.json (optional)
    catalog_path = niche_dir / "catalog.json"
    catalog: list[dict] = []
    if catalog_path.exists():
        with open(catalog_path, "r", encoding="utf-8") as f:
            catalog = json.load(f)

    # Load faq.json (optional)
    faq_path = niche_dir / "faq.json"
    faq: list[dict] = []
    if faq_path.exists():
        with open(faq_path, "r", encoding="utf-8") as f:
            faq = json.load(f)

    return NicheConfig(
        name=name,
        business_name=raw.get("business_name", name),
        tagline=raw.get("tagline", ""),
        tone=raw.get("tone", "professional"),
        language_default=raw.get("language_default", "en"),
        qualifying_questions=raw.get("qualifying_questions", []),
        lead_fields=raw.get("lead_fields", []),
        hard_rules=raw.get("hard_rules", []),
        handoff_triggers=raw.get("handoff_triggers", []),
        catalog_fields=raw.get("catalog_fields"),
        catalog=catalog,
        faq=faq,
    )

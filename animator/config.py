"""Loads config.json (merged over built-in defaults) so everything is editable from the GitHub web UI."""
import copy
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

DEFAULTS = {
    "channel": {"name": "DailyIQ", "name_accent": "IQ", "handle": "@DailyIQ-p2k", "end_text": "Follow for more"},
    "voice": {"name": "en-IN-NeerjaNeural", "rate": "+6%", "pitch": "+0Hz", "fallback_names": ["en-IN-PrabhatNeural", "en-US-AriaNeural"]},
    "video": {"fps": 30, "caption_words": 4, "gap_between_scenes": 0.2, "min_scene_seconds": 2.4, "tail_seconds": 0.5,
              "end_card_seconds": 3.4, "title_in_video": True, "music": True, "music_volume_db_under_voice": 15},
    "llm": {"providers": [], "scenes_min": 8, "scenes_max": 12, "audience": "curious Indian English speakers", "target_seconds": 45},
}


def _merge(base, extra):
    out = copy.deepcopy(base)
    for k, v in (extra or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _merge(out[k], v)
        else:
            out[k] = v
    return out


def load(path=None):
    p = Path(path) if path else ROOT / "config.json"
    user = {}
    if p.exists():
        try:
            user = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise SystemExit(f"config.json is not valid JSON: {e}")
    cfg = _merge(DEFAULTS, user)
    if os.environ.get("ANIMATOR_VOICE"):
        cfg["voice"]["name"] = os.environ["ANIMATOR_VOICE"]
    return cfg

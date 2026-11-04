"""Topic -> spec JSON using free LLM APIs (OpenRouter, Groq, Gemini). Uses only urllib (no extra dependencies).
API keys come from environment variables: OPENROUTER_API_KEY, GROQ_API_KEY, GEMINI_API_KEY. The first provider/model that answers wins."""
import json
import os
import re
import time
import urllib.error
import urllib.request

from . import spec as specmod

ENV_KEYS = {"openrouter": "OPENROUTER_API_KEY", "groq": "GROQ_API_KEY", "gemini": "GEMINI_API_KEY"}


def build_prompt(topic, cfg):
    llm = cfg["llm"]
    return f"""You write scripts for a faceless YouTube Short (vertical, about {llm['target_seconds']} seconds) for the tech-explainer channel "{cfg['channel']['name']}".
Audience: {llm['audience']}. Tone: friendly, curious, simple words, short sentences, spoken English (Indian English is fine).

TOPIC: {topic}

Return ONLY one JSON object, no markdown, in this shape:
{{
  "title": "max 4 words, max 30 characters, no quotes",
  "description": "one or two sentences for the YouTube description",
  "hashtags": ["#shorts", "...", "..."],
  "scenes": [
    {{"say": "one spoken sentence of 8 to 16 words", "type": "<scene type>", "data": {{ ... }} }}
  ]
}}

Rules:
- {llm['scenes_min']} to {llm['scenes_max']} scenes. Each "say" is ONE complete sentence that sounds natural when read aloud. No symbols, no emojis, no abbreviations with dots, write numbers the way they are spoken.
- Scene 1 is the hook: type "hook" (or "searchbar" for a what-if-X-disappeared topic) and its "say" must grab attention in the first seconds.
- Every visual must illustrate what its sentence says. Use a variety of scene types, no type more than 3 times.
- The last scene is a takeaway, usually type "keypoints" or "alert" with kind "success".
- Be accurate. Do not invent statistics, dates or company claims. If you are not sure of a number, do not use a counter or bars scene.
- Do not use brand logos or brand names as icons; use only the allowed generic icon names.
- Keep all labels short (1-2 words) so they fit on a phone screen.
{specmod.SCHEMA_HELP}"""


def _post(url, payload, headers, timeout=120):
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json", "Accept": "application/json", "User-Agent": "Mozilla/5.0 (compatible; dailyiq-animator/1.0)", **headers}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def _call(provider, model, prompt, key):
    if provider == "openrouter":
        out = _post("https://openrouter.ai/api/v1/chat/completions",
                    {"model": model, "temperature": 0.7, "messages": [{"role": "user", "content": prompt}]},
                    {"Authorization": f"Bearer {key}", "HTTP-Referer": "https://github.com", "X-Title": "dailyiq-animator"})
        return out["choices"][0]["message"]["content"]
    if provider == "groq":
        out = _post("https://api.groq.com/openai/v1/chat/completions",
                    {"model": model, "temperature": 0.7, "response_format": {"type": "json_object"}, "messages": [{"role": "user", "content": prompt}]},
                    {"Authorization": f"Bearer {key}"})
        return out["choices"][0]["message"]["content"]
    if provider == "gemini":
        out = _post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}",
                    {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.7, "responseMimeType": "application/json"}}, {})
        return out["candidates"][0]["content"]["parts"][0]["text"]
    raise ValueError(f"unknown provider {provider}")


def extract_json(text):
    """Pull the first JSON object out of an LLM reply (handles code fences and trailing commas)."""
    t = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
    a, b = t.find("{"), t.rfind("}")
    if a < 0 or b <= a:
        raise ValueError("no JSON object in reply")
    t = t[a:b + 1]
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        return json.loads(re.sub(r",\s*([}\]])", r"\1", t))


_SKIP = ("whisper", "orpheus", "guard", "tts", "safeguard", "embed", "distil-whisper")


def _get(url, headers):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0 (compatible; dailyiq-animator/1.0)", **headers})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def candidate_models(name, key, configured, log=print):
    """Groq: ask the API which models this key can really use (model names change often), keep the configured order first,
    then append any other chat model that is available."""
    if name != "groq":
        return list(configured)
    try:
        ids = [m["id"] for m in _get("https://api.groq.com/openai/v1/models", {"Authorization": f"Bearer {key}"}).get("data", [])]
    except Exception as e:
        log(f"[llm] could not list groq models ({type(e).__name__}); using config")
        return list(configured)
    chat = [i for i in ids if not any(w in i.lower() for w in _SKIP)]
    log(f"[llm] groq models available to this key: {', '.join(chat) or 'none'}")
    order = [m for m in configured if m in chat] + [m for m in chat if m not in configured]
    return order[:5] or list(configured)


def generate_spec(topic, cfg, log=print):
    prompt = build_prompt(topic, cfg)
    errors = []
    tried = 0
    for prov in cfg["llm"]["providers"]:
        name = prov["name"]
        key = os.environ.get(ENV_KEYS.get(name, ""), "").strip()
        if not key:
            continue
        for model in candidate_models(name, key, prov["models"], log):
            tried += 1
            for attempt in (1, 2):
                try:
                    log(f"[llm] {name} / {model} ...")
                    raw = _call(name, model, prompt, key)
                    spec = specmod.validate(extract_json(raw), cfg["llm"]["scenes_max"] + 2)
                    log(f"[llm] ok: {len(spec['scenes'])} scenes, title '{spec['title']}'")
                    return spec
                except urllib.error.HTTPError as e:
                    errors.append(f"{name}/{model}: HTTP {e.code} {e.read().decode('utf-8', 'ignore')[:160]}")
                    if e.code == 429 and attempt == 1:
                        time.sleep(6)
                        continue
                    break
                except Exception as e:  # network, JSON, validation...
                    errors.append(f"{name}/{model}: {type(e).__name__}: {str(e)[:120]}")
                    if attempt == 1 and isinstance(e, (ValueError, KeyError, json.JSONDecodeError)):
                        continue
                    break
    if not tried:
        raise SystemExit("No LLM API key found. Add OPENROUTER_API_KEY, GROQ_API_KEY or GEMINI_API_KEY (see README), or pass --spec my_script.json")
    raise SystemExit("All LLM attempts failed:\n  " + "\n  ".join(errors[-8:]))

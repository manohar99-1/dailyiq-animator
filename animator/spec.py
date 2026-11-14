"""The 'spec' is the JSON that describes a video: a title plus scenes, each with narration (`say`), a scene `type` and its `data`.
This module defines the allowed scene types, cleans up whatever an LLM returns, and explains the schema to the LLM."""
import re

SCENE_TYPES = ["hook", "searchbar", "flow", "network", "hub", "grid", "counter", "compare", "steps", "alert", "bars", "collapse", "keypoints", "toon", "talk", "story"]

ICON_NAMES = ("search mail map play video phone laptop cab car truck shop bell cloud server database lock wifi globe battery chip robot shield user users "
              "cart bag bank qr rupee money bolt clock calendar fire heart star camera music chat thumb home code plane gear warning check x question power link").split()

SCHEMA_HELP = """
Scene types (each scene = one spoken sentence + one animated visual). "data" fields:
- hook: {"lines": ["What if","Google","vanished?"] (1-3 short lines), "icon": "<icon>"}  -> big animated title. Use as FIRST scene.
- searchbar: {"query": "search anything", "word": "Google", "vanish": true}  -> a search bar that types, glitches and disappears. Good first scene for "what if X disappeared".
- flow: {"nodes": [{"icon": "phone", "label": "You"}, ...] (2-5 nodes), "layout": "row|column|zigzag"} -> a packet travels node to node. For "how X works".
- network: {"label": "Decentralized web", "from": "YOU", "to": "SITE", "crash": true, "crash_label": "CRASH!", "result": "STILL WORKS"} -> mesh network; one node crashes and traffic reroutes.
- hub: {"hub": {"icon": "cloud", "label": "Central"}, "spokes": [{"icon": "mail", "label": "Mail"}, ... 3-6], "fail": true, "label": "Single point of failure"} -> hub and spokes; hub fails, spokes go dark.
- grid: {"items": [{"icon": "mail", "label": "Mail"}, ... up to 9], "mode": "fail|light", "badge": "OUTAGE"} -> icon tiles that go dark one by one (fail) or light up (light).
- counter: {"value": 1000000, "from": 0, "prefix": "", "suffix": "+", "label": "short label", "sub": "optional small text", "icon": "<icon>", "plain": false} -> big number counting up. Set "plain": true for years.
- compare: {"a": {"title": "Before", "icon": "cash", "points": ["...", "..."]}, "b": {"title": "After", "icon": "phone", "points": ["..."]}, "winner": "a|b"} -> two cards with VS.
- steps: {"title": "How it works", "steps": ["Scan the QR", "Enter the amount", ...] (2-5, each max 6 words)} -> numbered timeline that ticks off.
- alert: {"kind": "warning|error|success|info", "text": "OUTAGE", "sub": "optional one line"} -> big alert symbol with a word.
- bars: {"title": "Chart title", "bars": [{"label": "2019", "value": 10}, ... 2-6], "unit": "%"} -> growing bar chart. Only use numbers you are confident are true.
- collapse: {"items": ["phone","laptop","cab","shop","play"] (icon names, 3-5), "label": ["SINGLE POINT","OF FAILURE"]} -> everything stands on one pillar that breaks.
- toon: {"cast": [{"who": "earth", "mood": "happy", "mood2": "shocked", "act": "float"}, ...] (1-3 characters), "layout": "auto|solo|duo|trio|orbit", "at": 0.5, "label": "NO MOON!"}
  -> cute cartoon characters with faces. Each character shows `mood`, then switches to `mood2` at fraction `at` of the scene, so the faces REACT to what the sentence says.
  who: sun earth moon star cloud buddy astronaut (human-shaped spacesuit figure) blackhole (a realistic black hole with glowing disk, no face; use act float and optional size) phone bulb server coin (buddy = friendly round robot for anything else; phone/server/cloud/coin/bulb for tech topics).
  SEA LIFE (for ocean/animal topics): fish whale dolphin shark jellyfish octopus turtle crab angler (anglerfish with glowing lure) sub (yellow submarine).
  MOTION acts for characters: swim (travels across the screen; optional "from"/"to" in left right top bottom high deep center, optional "dir":"left|right", optional "start"/"end" 0-1 = fraction of the scene when the move happens, so a chase is two swimmers with different start times and a flee is "from":"center","to":"right","start":0.5,"end":0.8), dive (sinks from high to deep), rise (goes up), circle (loops around the middle), wiggle (body sways), plus the acts below.
  OCEAN BACKGROUND: in "data" add "bg":"ocean" and "depth": metres at the start of the scene, "depth2": metres at the end (0 to 11000). The water darkens with depth, a depth gauge shows the number, bubbles and drifting particles show the descent. Use it for every scene of an ocean video, with depth rising from scene to scene.
  mood/mood2: happy joy excited shocked scared worried gasp fear sad cry angry sleepy love dizzy cool thinking.
  act: float (default) hop shake spin vanish (character pops out of existence at `at`) appear fall grow shrink.
  layout "orbit": first character in the centre, second circles it, third circles the second (sun, earth, moon). "label": optional 1-3 word banner at the top (ALL CAPS).
  Example (moon disappears): {"cast": [{"who": "earth", "mood": "happy", "mood2": "shocked"}, {"who": "moon", "mood": "happy", "act": "vanish"}], "layout": "orbit", "at": 0.5, "label": "NO MOON!"}
- keypoints: {"points": ["Short idea one", "Short idea two", "Short idea three"] (1-4, each max 5 words)} -> stacked bullet cards. Good for the final takeaway.
Allowed icon names: """ + ", ".join(ICON_NAMES) + """.
"""

_BAD_CHARS = re.compile(r"[\*\_`#<>\[\]{}|\\^~]")


def clean_say(s):
    s = _BAD_CHARS.sub("", str(s or "")).replace("&", " and ").replace("%", " percent").replace("/", " or ")
    s = re.sub(r"\s+", " ", s).strip()
    if s and s[-1] not in ".?!":
        s += "."
    return s


def _short(s, words=5):
    w = re.sub(r"[^\w\s'-]", "", str(s)).split()
    return " ".join(w[:words]) or "Key idea"


TOON_WHO = "sun earth moon star cloud buddy astronaut blackhole phone bulb server coin fish whale dolphin shark jellyfish octopus turtle crab angler sub noodle pot bowl chopsticks cheese brain clock clock3 coffee ball pan smartphone hero friend priest invis ghost burger cake blanket bubble book lamp chair table gift".split()
TOON_MOODS = "happy joy excited shocked scared worried boo sad cry angry sleepy love dizzy cool thinking smart puzzled tired deadpan yawn".split()
TOON_ACTS = "float hop shake spin vanish appear fall grow shrink stretch suck splat swim dive rise circle wiggle".split()
ANCHORS = ("left", "right", "top", "bottom", "high", "deep", "center", "base")


def _clean_toon(d):
    cast = []
    for c in (d.get("cast") if isinstance(d.get("cast"), list) else [])[:6]:
        if not isinstance(c, dict):
            continue
        who = str(c.get("who") or "buddy").lower().strip()
        mood = str(c.get("mood") or "happy").lower().strip()
        mood2 = str(c.get("mood2") or mood).lower().strip()
        act = str(c.get("act") or "float").lower().strip()
        cast.append({"who": who if who in TOON_WHO else who, "mood": mood if mood in TOON_MOODS else "happy",
                     "mood2": mood2 if mood2 in TOON_MOODS else (mood if mood in TOON_MOODS else "happy"),
                     "act": act if act in TOON_ACTS else "float"})
        e = cast[-1]
        for k in ("size",):
            try:
                e[k] = min(3.0, max(.2, float(c[k])))
            except (KeyError, TypeError, ValueError):
                pass
        if isinstance(c.get("pos"), list) and len(c["pos"]) >= 2:
            try:
                e["pos"] = [float(v) for v in c["pos"][:3]]
            except (TypeError, ValueError):
                pass
        for k in ("from", "to"):
            if str(c.get(k, "")).lower() in ANCHORS:
                e[k] = str(c[k]).lower()
        if str(c.get("enter", "")).lower() in ("left", "right", "top", "bottom"):
            e["enter"] = str(c["enter"]).lower()
        if c.get("brief"):
            e["brief"] = True
        if c.get("walk"):
            e["walk"] = True
        if isinstance(c.get("text"), str) and c["text"].strip():
            e["text"] = c["text"].strip()[:24]
        if isinstance(c.get("color"), str) and re.match(r"^#[0-9a-fA-F]{3,8}$", c["color"]):
            e["color"] = c["color"]
        try:
            if "delay" in c:
                e["delay"] = min(5.0, max(0.0, float(c["delay"])))
        except (TypeError, ValueError):
            pass
        if str(c.get("dir", "")).lower() in ("left", "right"):
            e["dir"] = str(c["dir"]).lower()
        for k in ("start", "end"):
            try:
                e[k] = min(1.0, max(0.0, float(c[k])))
            except (KeyError, TypeError, ValueError):
                pass
    if not cast:
        cast = [{"who": "buddy", "mood": "happy", "mood2": "thinking", "act": "float"}]
    out = {"cast": cast, "layout": d.get("layout") if d.get("layout") in ("auto", "solo", "duo", "trio", "orbit") else "auto"}
    try:
        out["at"] = min(.85, max(.15, float(d.get("at", .5))))
    except (TypeError, ValueError):
        out["at"] = .5
    if d.get("bg") in ("ocean", "day", "space", "kitchen", "bedroom", "control", "chat", "memory", "night", "plain", "inv_kitchen", "inv_dark", "inv_restaurant", "inv_comments", "inv_bath", "inv_bed", "inv_street", "inv_living", "inv_room"):
        out["bg"] = d["bg"]
    for k in ("depth", "depth2"):
        try:
            out[k] = min(11000.0, max(0.0, float(d[k])))
        except (KeyError, TypeError, ValueError):
            pass
    if d.get("label"):
        out["label"] = str(d["label"]).upper()[:22]
    return out


TALK_WHO = TOON_WHO + "buddy earth moon sun cloud soil worm drop seed sprout flower".split()


def _clean_talk(d):
    cast = []
    for c in (d.get("cast") if isinstance(d.get("cast"), list) else [])[:3]:
        if not isinstance(c, dict):
            continue
        mood = str(c.get("mood") or "happy").lower()
        e = {"who": str(c.get("who") or "buddy").lower(), "mood": mood if mood in TOON_MOODS else "happy"}
        if str(c.get("where", "")).lower() in ("ground", "under", "sky"):
            e["where"] = str(c["where"]).lower()
        if c.get("name"):
            e["name"] = str(c["name"])[:14]
        cast.append(e)
    if not cast:
        cast = [{"who": "buddy", "mood": "happy"}]
    n = len(cast)
    lines = []
    for L in (d.get("lines") if isinstance(d.get("lines"), list) else [])[:10]:
        if not isinstance(L, dict):
            continue
        text = _BAD_CHARS.sub("", str(L.get("text") or "")).strip()
        if not text:
            continue
        who = L.get("who", 0)
        if not isinstance(who, int):
            who = next((i for i, c in enumerate(cast) if str(who).lower() in (c["who"], str(c.get("name", "")).lower())), 0)
        e = {"who": max(0, min(n - 1, who)), "text": text[:110]}
        if str(L.get("mood", "")).lower() in TOON_MOODS:
            e["mood"] = str(L["mood"]).lower()
        if isinstance(L.get("react"), dict):
            e["react"] = {str(k): v for k, v in L["react"].items() if str(v).lower() in TOON_MOODS}
        if isinstance(L.get("change"), dict):
            e["change"] = {str(k): str(v).lower() for k, v in L["change"].items()}
        lines.append(e)
    out = {"cast": cast, "lines": lines, "bg": d.get("bg") if d.get("bg") in ("garden", "cutaway", "rain") else "garden"}
    if d.get("label"):
        out["label"] = str(d["label"]).upper()[:26]
    return out


def _clean_story(d):
    """Image-based story scene (see engine/story.js). Cast / props / effects are passed through; text is cleaned."""
    out = {k: v for k, v in d.items() if k not in ("lines",)}
    out["cast"] = [c for c in (d.get("cast") or []) if isinstance(c, dict)][:8]
    lines = []
    for L in (d.get("lines") if isinstance(d.get("lines"), list) else [])[:16]:
        if not isinstance(L, dict):
            continue
        text = re.sub(r"\s+", " ", _BAD_CHARS.sub("", str(L.get("text") or "")).replace("&", " and ").replace("%", " percent")).strip()
        if not text:
            continue
        e = dict(L)
        e["text"] = text
        lines.append(e)
    out["lines"] = lines
    out.setdefault("bg", "soil")
    return out


def validate(spec, max_scenes=14):
    """Return a cleaned copy of the spec. Never raises for fixable problems; raises ValueError if nothing usable is left."""
    if not isinstance(spec, dict):
        raise ValueError("spec must be a JSON object")
    scenes = []
    for sc in (spec.get("scenes") or [])[:max_scenes]:
        if not isinstance(sc, dict):
            continue
        typ = str(sc.get("type") or "").strip().lower()
        data = sc.get("data") if isinstance(sc.get("data"), dict) else {}
        if typ == "story":
            data = _clean_story(data)
            if not data["lines"]:
                continue
            scenes.append({"say": " ".join(L["text"] for L in data["lines"]), "type": "story", "data": data})
            continue
        if typ == "talk":
            data = _clean_talk(data)
            if not data["lines"]:
                continue
            scenes.append({"say": " ".join(L["text"] for L in data["lines"]), "type": "talk", "data": data})
            continue
        say = clean_say(sc.get("say") or sc.get("narration") or sc.get("text"))
        if not say:
            continue
        if typ not in SCENE_TYPES:
            typ, data = "keypoints", {"points": [_short(say, 5)]}
        if typ == "toon":
            data = _clean_toon(data)
        scenes.append({"say": say, "type": typ, "data": data})
    if len(scenes) < 2:
        raise ValueError("spec needs at least 2 scenes with narration")
    title = re.sub(r"\s+", " ", _BAD_CHARS.sub("", str(spec.get("title") or "Untitled"))).strip()[:60]
    tags = [("#" + re.sub(r"\W", "", str(t).lstrip("#"))) for t in (spec.get("hashtags") or []) if re.sub(r"\W", "", str(t))]
    tags = list(dict.fromkeys(tags))[:5] or ["#shorts"]
    out = {"title": title, "description": str(spec.get("description") or "")[:400].strip(), "hashtags": tags, "scenes": scenes}
    if isinstance(spec.get("look"), dict) and spec["look"].get("frame") == "wide":
        out["look"] = {"frame": "wide"}
    if spec.get("silent"):
        out["silent"] = True
    return out

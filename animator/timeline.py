"""Turns (spec + clip lengths) into absolute timings: scene start/end, caption chunks, and the full-length voice track."""
import re
import wave

import numpy as np

from . import lipsync

SR = 44100
PAD = 0.05  # silence before each sentence starts inside its scene


def _chunks(say, max_words):
    """Split a sentence into short caption chunks (3-5 words, breaking after punctuation)."""
    words = say.split()
    out, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) >= max_words or re.search(r"[,;:.?!]$", w) and len(cur) >= 2 or sum(len(x) + 1 for x in cur) > 24:
            out.append(cur)
            cur = []
    if cur:
        if out and len(cur) == 1:
            out[-1] += cur
        else:
            out.append(cur)
    return out


def _caption_times(say, t0, dur, scene_end, max_words):
    chunks = _chunks(say, max_words)
    # weight each word by its length (+ a pause after punctuation) to estimate when it is spoken
    weights = [[len(w) + 2 + (4 if re.search(r"[,;:.?!]$", w) else 0) for w in c] for c in chunks]
    total = sum(sum(w) for w in weights) or 1
    t, caps = t0, []
    for c, w in zip(chunks, weights):
        span = dur * sum(w) / total
        caps.append({"s": round(t, 3), "e": round(t + span, 3), "text": " ".join(c)})
        t += span
    for i in range(len(caps) - 1):          # no flicker: each caption stays until the next starts
        caps[i]["e"] = caps[i + 1]["s"]
    if caps:
        caps[-1]["e"] = round(scene_end, 3)
    return caps


def build(spec, cfg, clips):
    v = cfg["video"]
    gap, min_s, tail = v["gap_between_scenes"], v["min_scene_seconds"], v["tail_seconds"]
    t, scenes, caps = 0.0, [], []
    fps = int(v.get("fps", 30))
    for i, (sc, clip) in enumerate(zip(spec["scenes"], clips)):
        if sc["type"] == "story":
            t_in, lines, voices = 0.0, [], []
            for j, (L, part) in enumerate(zip(sc["data"]["lines"], clip["lines"])):
                t0 = t_in + float(L.get("pause", PAD if j == 0 else .1))
                t1 = t0 + part["dur"]
                env = lipsync.from_wav(part["wav"], fps) if part["wav"] else lipsync.fake(L["text"], part["dur"], fps)
                lines.append(dict(L, t0=round(t0, 3), t1=round(t1, 3), env=env))
                if part["wav"]:
                    voices.append({"wav": part["wav"], "at": round(t + t0, 3)})
                t_in = t1 + max(float(v.get("line_gap", .22)), float(L.get("hold", 0)))
            sdur = max(min_s, t_in + gap) + (tail if i == len(clips) - 1 else 0)
            start, end = t, t + sdur
            for j, L in enumerate(lines):          # subtitles follow each line; they stay until the next line starts
                nxt = lines[j + 1]["t0"] if j + 1 < len(lines) else sdur
                caps += _caption_times(L["text"], start + L["t0"], L["t1"] - L["t0"], start + nxt, v["caption_words"])
            data = dict(sc["data"], lines=lines, fps=fps)
            scenes.append({"type": "story", "data": data, "say": sc["say"], "start": round(start, 3), "end": round(end, 3),
                           "voice_at": round(start, 3), "wav": None, "voices": voices})
            t = end
            continue
        dur = clip["dur"]
        sdur = max(min_s, PAD + dur + gap) + (tail if i == len(clips) - 1 else 0)
        start, end = t, t + sdur
        if sc["type"] != "talk":      # conversations show their words in speech bubbles instead
            caps += _caption_times(sc["say"], start + PAD, dur, end, v["caption_words"])
        scenes.append({"type": sc["type"], "data": sc["data"], "say": sc["say"], "start": round(start, 3), "end": round(end, 3),
                       "voice_at": round(start + PAD, 3), "wav": clip["wav"]})
        t = end
    return {"title": spec["title"], "channel": cfg["channel"], "scenes": scenes, "captions": caps, "T": round(t, 3),
            "end": v["end_card_seconds"], "look": {"title_in_video": v["title_in_video"]}}


def write_voice_track(rt, path):
    """Mix every sentence clip onto one silent track as long as the whole video."""
    total = int((rt["T"] + rt["end"]) * SR)
    track = np.zeros(total, dtype=np.int16)
    clips = [(s["wav"], s["voice_at"]) for s in rt["scenes"] if s["wav"]]
    for s in rt["scenes"]:
        clips += [(vc["wav"], vc["at"]) for vc in s.get("voices", [])]
    for wav, at in clips:
        with wave.open(str(wav), "rb") as w:
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        a = int(at * SR)
        track[a:a + len(data)] = data[: max(0, total - a)]
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(track.tobytes())

"""Turns (spec + clip lengths) into absolute timings: scene start/end, caption chunks, and the full-length voice track."""
import re
import wave

import numpy as np

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
    for i, (sc, clip) in enumerate(zip(spec["scenes"], clips)):
        dur = clip["dur"]
        sdur = max(min_s, PAD + dur + gap) + (tail if i == len(clips) - 1 else 0)
        start, end = t, t + sdur
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
    for s in rt["scenes"]:
        if not s["wav"]:
            continue
        with wave.open(str(s["wav"]), "rb") as w:
            data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
        a = int(s["voice_at"] * SR)
        track[a:a + len(data)] = data[: max(0, total - a)]
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(track.tobytes())

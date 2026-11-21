"""Build the Ant Short voiceover: one Kokoro clip per phrase, own speed/pitch/volume/pause, timing JSON."""
import json
import sys
from fractions import Fraction
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from scipy.signal import resample_poly

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
VOICE = "am_adam"
SR = 24000
LEAD = 0.15

# scene, text, speed, pitch(<1 lower+slower via resample), volume, pause after (s)
PHRASES = [
    (1, "What if you suddenly became smaller than an ant?", 1.0, 1.0, 1.0, 0.55),
    (1, "Your bedroom would turn into a giant wilderness!", 1.0, 0.98, 1.08, 0.8),
    (2, "Your carpet would look like a forest, and every dust particle would look enormous.", 0.95, 1.0, 1.0, 0.8),
    (3, "Then comes water.", 0.92, 0.97, 1.0, 0.5),
    (3, "A tiny droplet acts like a sticky dome!", 1.0, 1.0, 1.05, 0.35),
    (3, "At this size, surface tension could trap you!", 0.98, 0.98, 1.0, 0.8),
    (4, "Even moving air becomes a challenge.", 1.0, 1.0, 1.0, 0.45),
    (4, "And then...", 0.9, 0.97, 1.0, 0.4),
    (4, "An ant approaches.", 0.9, 0.95, 1.0, 0.45),
    (4, "To you, it's a giant creature walking straight towards you!", 1.0, 1.0, 1.1, 0.8),
    (5, "Here's the science:", 1.0, 1.0, 1.0, 0.3),
    (5, "the smaller you get, the more surface area you have compared with your volume.", 0.95, 1.0, 1.0, 0.35),
    (5, "So air resistance and water surface tension matter far more.", 0.95, 1.0, 1.0, 0.8),
    (6, "But here's the biggest problem.", 0.95, 0.96, 1.0, 0.45),
    (6, "Human cells can't shrink, so a body that small couldn't hold a working brain.", 0.97, 1.0, 1.0, 0.4),
    (6, "Surviving at this size is impossible!", 0.92, 0.96, 1.08, 0.9),
    (7, "Follow Daily IQ to discover more!", 1.0, 1.0, 1.0, 0.3),
]


def pitch_shift(x, f):
    if abs(f - 1.0) < 1e-6:
        return x
    r = Fraction(1 / f).limit_denominator(100)
    return resample_poly(x, r.numerator, r.denominator).astype(np.float32)


def trim(x, thr=0.004, keep=0.03):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(keep * SR))
    b = min(len(x), idx[-1] + int(keep * SR))
    return x[a:b]


k = Kokoro(str(Path.home() / ".cache/dailyiq/kokoro-v1.0.int8.onnx"), str(Path.home() / ".cache/dailyiq/voices-v1.0.bin"))
audio = [np.zeros(int(LEAD * SR), dtype=np.float32)]
t = LEAD
timing = []
for i, (scene, text, speed, pitch, vol, pause) in enumerate(PHRASES):
    x, sr = k.create(text, voice=VOICE, speed=speed, lang="en-us")
    assert sr == SR, sr
    x = trim(np.asarray(x, dtype=np.float32))
    x = pitch_shift(x, pitch) * vol
    dur = len(x) / SR
    words = text.split()
    wl = np.array([max(2, len(w.strip(".,!?:'"))) for w in words], dtype=float)
    edges = np.concatenate([[0], np.cumsum(wl) / wl.sum()]) * dur
    timing.append({
        "i": i, "scene": scene, "text": text, "start": round(t, 3), "end": round(t + dur, 3),
        "words": [{"w": w, "s": round(t + edges[j], 3), "e": round(t + edges[j + 1], 3)} for j, w in enumerate(words)],
    })
    audio.append(x)
    audio.append(np.zeros(int(pause * SR), dtype=np.float32))
    t += dur + pause

full = np.concatenate(audio)
peak = np.max(np.abs(full))
full = full / max(peak, 1e-6) * 0.9
sf.write(str(OUT / "voice_raw.wav"), full, SR)
scenes = {}
for p in timing:
    s = scenes.setdefault(p["scene"], {"start": p["start"], "end": p["end"]})
    s["end"] = p["end"]
meta = {"sr": SR, "total": round(len(full) / SR, 3), "phrases": timing, "scenes": scenes}
(OUT / "timing_raw.json").write_text(json.dumps(meta, indent=1))
main_end = max(p["end"] for p in timing if p["scene"] <= 6)
print("phrases:", len(timing), "total s:", meta["total"], "main (scenes 1-6) ends:", round(main_end, 2))
for p in timing:
    print(f'{p["start"]:6.2f}-{p["end"]:6.2f}  S{p["scene"]}  {p["text"][:60]}')

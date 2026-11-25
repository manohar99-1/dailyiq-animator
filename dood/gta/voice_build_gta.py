"""GTA Short voiceover: one Kokoro clip per phrase, timing JSON with word times. usage: voice_build_gta.py out"""
import json, sys
from fractions import Fraction
from pathlib import Path
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
from scipy.signal import resample_poly

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
VOICE, SR, LEAD = "am_adam", 24000, 0.2
SAY = {"GTA": "G T A", "6": "six", "₹0": "zero rupees", "₹500": "five hundred rupees"}  # spoken form of display words

# scene, display text, speed, pitch, volume, pause after
PHRASES = [
    (1, "Imagine waking up one day and discovering your entire life has turned into GTA 6!", 1.0, 1.0, 1.05, 1.1),
    (2, "You accidentally bump into someone, and suddenly you're wanted by the entire police department.", 1.02, 1.0, 1.0, 0.45),
    (2, "Bro, you didn't even steal a sandwich!", 1.0, 1.0, 1.08, 0.9),
    (3, "Then you discover that cars are free!", 1.0, 1.0, 1.0, 0.4),
    (3, "Well... until the owner discovers you.", 0.92, 0.97, 1.0, 0.8),
    (4, "Now you're in a police chase.", 1.0, 1.0, 1.0, 0.35),
    (4, "Your driving skills are so terrible, even the police are considering calling an ambulance for themselves!", 1.03, 1.0, 1.05, 0.9),
    (5, "At least you can respawn!", 1.0, 1.0, 1.05, 0.35),
    (5, "But there's one tiny problem... there's no money cheat in real life.", 0.97, 1.0, 1.0, 0.4),
    (5, "And your bank account is looking more dead than your last character!", 1.0, 1.0, 1.08, 0.9),
    (6, "And after all that chaos, you finally unlock the biggest mission in GTA...", 1.0, 1.0, 1.0, 0.45),
    (6, "becoming a delivery boy!", 0.95, 0.98, 1.1, 0.8),
]

def pitch_shift(x, f):
    if abs(f - 1) < 1e-6: return x
    r = Fraction(1 / f).limit_denominator(100)
    return resample_poly(x, r.numerator, r.denominator).astype(np.float32)

def trim(x, thr=0.004, keep=0.03):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0: return x
    return x[max(0, idx[0] - int(keep * SR)): min(len(x), idx[-1] + int(keep * SR))]

k = Kokoro(str(Path.home() / ".cache/dailyiq/kokoro-v1.0.int8.onnx"), str(Path.home() / ".cache/dailyiq/voices-v1.0.bin"))
audio = [np.zeros(int(LEAD * SR), dtype=np.float32)]
t, timing = LEAD, []
for i, (scene, text, speed, pitch, vol, pause) in enumerate(PHRASES):
    words = text.split()
    spoken = " ".join(SAY.get(w.strip("!.,?"), w) if w.strip("!.,?") in SAY else w for w in words)
    spoken = spoken.replace("GTA 6", "G T A six").replace("GTA...", "G T A...")
    x, sr = k.create(spoken, voice=VOICE, speed=speed, lang="en-us")
    assert sr == SR
    x = pitch_shift(trim(np.asarray(x, dtype=np.float32)), pitch) * vol
    dur = len(x) / SR
    wl = np.array([max(2, len(SAY.get(w.strip('!.,?'), w).strip(".,!?:'"))) for w in words], dtype=float)
    edges = np.concatenate([[0], np.cumsum(wl) / wl.sum()]) * dur
    timing.append({"i": i, "scene": scene, "text": text, "start": round(t, 3), "end": round(t + dur, 3),
                   "words": [{"w": w, "s": round(t + edges[j], 3), "e": round(t + edges[j + 1], 3)} for j, w in enumerate(words)]})
    audio += [x, np.zeros(int(pause * SR), dtype=np.float32)]
    t += dur + pause

full = np.concatenate(audio)
full = full / max(np.max(np.abs(full)), 1e-6) * 0.9
sf.write(str(OUT / "voice_raw.wav"), full, SR)
scenes = {}
for p in timing:
    s = scenes.setdefault(p["scene"], {"start": p["start"], "end": p["end"]}); s["end"] = p["end"]
(OUT / "timing_raw.json").write_text(json.dumps({"sr": SR, "total": round(len(full) / SR, 3), "phrases": timing, "scenes": scenes}, indent=1))
print("total", round(len(full) / SR, 2))
for p in timing: print(f'{p["start"]:6.2f}-{p["end"]:6.2f} S{p["scene"]} {p["text"][:64]}')

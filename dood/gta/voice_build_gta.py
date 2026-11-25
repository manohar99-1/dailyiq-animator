"""GTA Short voiceover with emotional delivery. Each logical phrase is built from segments; every segment has its own
speed, pitch (semitones, duration-preserving via rubberband), volume and gap. usage: voice_build_gta.py out"""
import json, subprocess, sys, tempfile
from pathlib import Path
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
VOICE, SR, LEAD = "am_adam", 24000, 0.2
SAY = {"GTA": "G T A", "6": "six", "6!": "six!", "GTA...": "G T A..."}   # spoken form of display words

# (scene, [ (text, speed, pitch_semitones, volume, gap_after_segment) ... ], pause_after_phrase)
PHRASES = [
    (1, [("Imagine waking up one day", 0.96, +0.6, 1.0, 0.10),            # curious, inviting
         ("and discovering your entire life", 1.0, 0.0, 1.0, 0.08),        # building
         ("has turned into", 0.95, +1.0, 1.02, 0.10),                      # anticipation
         ("GTA 6!", 1.0, +2.6, 1.18, 0)], 1.1),                            # excited reveal
    (2, [("You accidentally bump into someone,", 1.05, +0.3, 1.0, 0.14),   # light, casual
         ("and suddenly", 0.98, +1.0, 1.0, 0.10),
         ("you're wanted by the entire police department.", 0.92, -1.6, 1.06, 0)], 0.5),   # grave, dramatic
    (2, [("Bro,", 0.94, +2.2, 1.12, 0.28),                                 # incredulous
         ("you didn't even steal a sandwich!", 1.06, +1.6, 1.14, 0)], 0.9),  # indignant, funny
    (3, [("Then you discover", 1.05, +1.0, 1.0, 0.06),
         ("that cars are free!", 1.04, +2.4, 1.14, 0)], 0.45),             # delighted
    (3, [("Well...", 0.82, -2.2, 0.98, 0.3),                               # sly drop
         ("until the owner discovers you.", 0.9, -2.8, 1.04, 0)], 0.8),   # ominous
    (4, [("Now you're in a police chase.", 1.1, +0.8, 1.1, 0)], 0.35),     # tense, fast
    (4, [("Your driving skills are so terrible,", 1.02, -0.6, 1.0, 0.16),  # sarcastic
         ("even the police are considering calling an ambulance for themselves!", 1.09, +1.4, 1.12, 0)], 0.9),  # punchline
    (5, [("At least you can respawn!", 1.02, +2.0, 1.08, 0)], 0.4),         # relieved, cheery
    (5, [("But there's one tiny problem...", 0.88, -1.6, 1.0, 0.32),       # slow, uneasy
         ("there's no money cheat in real life.", 0.93, -2.4, 1.02, 0)], 0.4),   # deadpan
    (5, [("And your bank account is looking", 1.02, +0.4, 1.0, 0.1),
         ("more dead than your last character!", 1.06, +1.2, 1.14, 0)], 0.9),   # comic punch
    (6, [("And after all that chaos,", 0.92, -1.2, 0.98, 0.2),             # tired
         ("you finally unlock the biggest mission in GTA...", 1.0, +1.0, 1.04, 0)], 0.5),  # building
    (6, [("becoming a delivery boy!", 0.94, +2.8, 1.18, 0)], 0.8),          # triumphant, mock epic
]

def trim(x, thr=0.004, keep=0.03):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0: return x
    return x[max(0, idx[0] - int(keep * SR)): min(len(x), idx[-1] + int(keep * SR))]

def shift(x, st):
    if abs(st) < 0.05: return x
    with tempfile.TemporaryDirectory() as d:
        a, b = Path(d) / "a.wav", Path(d) / "b.wav"
        sf.write(str(a), x, SR)
        f = 2 ** (st / 12)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a), "-af", f"rubberband=pitch={f:.5f}:formant=preserved", str(b)], check=True)
        y, _ = sf.read(str(b))
    return np.asarray(y, dtype=np.float32)

def fade(x, ms=8):
    n = int(ms / 1000 * SR)
    if len(x) > 2 * n:
        x = x.copy(); x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    return x

k = Kokoro(str(Path.home() / ".cache/dailyiq/kokoro-v1.0.int8.onnx"), str(Path.home() / ".cache/dailyiq/voices-v1.0.bin"))
audio = [np.zeros(int(LEAD * SR), dtype=np.float32)]
t, timing = LEAD, []
for i, (scene, segs, pause) in enumerate(PHRASES):
    t_phrase = t; words_out = []; full_text = []
    for (text, speed, st, vol, gap) in segs:
        words = text.split(); full_text.append(text)
        spoken = " ".join(SAY.get(w, w) for w in words)
        x, sr = k.create(spoken, voice=VOICE, speed=speed, lang="en-us"); assert sr == SR
        x = fade(shift(trim(np.asarray(x, dtype=np.float32)), st)) * vol
        dur = len(x) / SR
        wl = np.array([max(2, len(SAY.get(w, w).strip(".,!?:'"))) for w in words], dtype=float)
        edges = np.concatenate([[0], np.cumsum(wl) / wl.sum()]) * dur
        for j, w in enumerate(words): words_out.append({"w": w, "s": round(t + edges[j], 3), "e": round(t + edges[j + 1], 3)})
        audio += [x, np.zeros(int(gap * SR), dtype=np.float32)]
        t += dur + gap
    timing.append({"i": i, "scene": scene, "text": " ".join(full_text), "start": round(t_phrase, 3), "end": round(t - segs[-1][4], 3), "words": words_out})
    audio.append(np.zeros(int(pause * SR), dtype=np.float32)); t += pause

full = np.concatenate(audio)
full = full / max(np.max(np.abs(full)), 1e-6) * 0.9
sf.write(str(OUT / "voice_raw.wav"), full, SR)
scenes = {}
for p in timing:
    s = scenes.setdefault(p["scene"], {"start": p["start"], "end": p["end"]}); s["end"] = p["end"]
(OUT / "timing_raw.json").write_text(json.dumps({"sr": SR, "total": round(len(full) / SR, 3), "phrases": timing, "scenes": scenes}, indent=1))
print("total", round(len(full) / SR, 2))
for p in timing: print(f'{p["start"]:6.2f}-{p["end"]:6.2f} S{p["scene"]} {p["text"][:70]}')

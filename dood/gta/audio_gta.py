"""Mix narration + synthesised SFX + ducked music for the GTA Short. usage: audio_gta.py DURATION out.wav"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

D = Path(__file__).parent; OUT = D / "out"
SR = 44100
dur = float(sys.argv[1]); N = int(dur * SR)
meta = json.loads((OUT / "timing_raw.json").read_text()); P = meta["phrases"]
rng = np.random.default_rng(11)

def W(pi, pat):
    for w in P[pi]["words"]:
        if w["w"].lower().startswith(pat): return w["s"]
    return P[pi]["words"][0]["s"]

def place(buf, x, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    a = max(0, -i); b = min(len(x), len(buf) - i)
    buf[i + a:i + b] += x[a:b] * gain

noise = lambda n: rng.standard_normal(n).astype(np.float32)
def sos(x, kind, f): return sosfilt(butter(2, f, btype=kind, fs=SR, output="sos"), x).astype(np.float32)
def env_fade(n, a, r):
    e = np.ones(n, dtype=np.float32); ia, ir = int(a * SR), int(r * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ir: e[-ir:] = np.minimum(e[-ir:], np.linspace(1, 0, ir))
    return e
def whoosh_down(length=1.0):
    n = int(length * SR); x = noise(n); a = np.linspace(0.5, 0.02, n); y = np.zeros(n, dtype=np.float32); s = 0.0
    for i in range(n):
        s += a[i] * (x[i] - s); y[i] = s
    tone = np.sin(2 * np.pi * np.cumsum(np.linspace(900, 120, n)) / SR).astype(np.float32) * 0.3
    return ((y / (np.max(np.abs(y)) + 1e-9) * 0.8 + tone) * np.sin(np.linspace(0, np.pi, n)) ** 1.3).astype(np.float32)
def zap(length=0.4):
    n = int(length * SR); t = np.arange(n) / SR
    f = 300 + 2600 * (t / length) ** 2
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3) * 0.6 + sos(noise(n), "high", 3000) * 0.15 * np.exp(-t * 6)).astype(np.float32)
def thud(length=0.5):
    n = int(length * SR); t = np.arange(n) / SR
    f = 55 + 70 * np.exp(-t * 18)
    return ((np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)) + sos(noise(n), "low", 500) * np.exp(-t * 30) * 1.5).astype(np.float32)
def blip(freq, length=0.14):
    n = int(length * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) * np.exp(-t * 22)).astype(np.float32)
def ding(freq, length=0.7):
    n = int(length * SR); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2.01 * t)) * np.exp(-t * 6)).astype(np.float32)
def step_click():
    n = int(0.05 * SR); t = np.arange(n) / SR
    return (sos(noise(n), "high", 1500) * np.exp(-t * 90)).astype(np.float32)
def click():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return (sos(noise(n), "high", 2500) * np.exp(-t * 160)).astype(np.float32)
def siren(length):
    n = int(length * SR); t = np.arange(n) / SR
    f = 820 + 260 * np.sin(2 * np.pi * 0.8 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return (x * env_fade(n, 0.4, 0.5) * 0.5).astype(np.float32)

F1 = W(0, "discovering") - 0.05; FL = F1 + 0.35
HUD0 = W(0, "turned") - 0.05
bumpT = W(1, "bump") + 0.25; wantT = W(1, "wanted"); policeT = W(1, "police"); sandT = W(2, "sandwich"); broT = W(2, "bro")
tS = meta["scenes"]["2"]["start"] - 0.4
backT = wantT + 1.8; walkOffT = sandT + 0.9

sfx = np.zeros(N, dtype=np.float32)
# couch: controller clicks, TV flicker buzz, flash
t = 0.5
while t < F1 - 0.2:
    place(sfx, click(), t, 0.25); t += 0.28 + 0.3 * rng.random()
place(sfx, sos(noise(int(0.45 * SR)), "band", (900, 2200)) * np.sin(np.linspace(0, 60, int(0.45 * SR))) ** 2 * 0.25, F1 - 0.45, 0.5)
place(sfx, zap(), F1, 0.7)
place(sfx, whoosh_down(1.0), FL, 0.7)
# HUD pops
for i, f in enumerate([660, 880, 1100, 1320]):
    place(sfx, blip(f), HUD0 + i * 0.2 + 0.05, 0.3)
# footsteps
step = 0.604; t = tS + 0.2
while t < bumpT: place(sfx, step_click(), t, 0.2); t += step
step = 0.561; t = tS + 0.35
while t < bumpT: place(sfx, step_click(), t, 0.16); t += step
t = backT
while t < broT - 0.1: place(sfx, step_click(), t, 0.15); t += 0.748
t = walkOffT
while t < dur: place(sfx, step_click(), t, 0.12); t += 0.561
place(sfx, thud(), bumpT, 0.6)
place(sfx, ding(1319), wantT, 0.4); place(sfx, ding(1760), wantT + 0.12, 0.4)
for j, f in enumerate([988, 1319, 1760]): place(sfx, ding(f, 0.5), policeT + j * 0.1, 0.3)
place(sfx, siren(max(0.5, dur - policeT)), policeT, 0.12)
place(sfx, blip(660, 0.16), sandT, 0.3); place(sfx, blip(990, 0.2), sandT + 0.08, 0.3)

v, vsr = sf.read(str(OUT / "voice_final.wav"))
if v.ndim > 1: v = v.mean(axis=1)
assert vsr == SR
voice = np.zeros(N, dtype=np.float32); m = min(N, len(v)); voice[:m] = v[:m]

music = np.zeros(N, dtype=np.float32); beat = 60 / 108
chords = [(98.0, [196.0, 246.94, 293.66]), (110.0, [220.0, 277.18, 329.63]), (87.31, [174.61, 220.0, 261.63]), (98.0, [196.0, 246.94, 392.0])]
def pluck(freq, length=0.4):
    n = int(length * SR); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(4 * np.pi * freq * t)) * np.exp(-t * 8)).astype(np.float32)
bar = 0; t = 0.0
while t < dur:
    root, tones = chords[bar % 4]
    place(music, pluck(root, 1.2) * 0.9, t, 0.5); place(music, pluck(root, 0.6) * 0.9, t + 2 * beat, 0.4)
    for j in range(8): place(music, pluck(tones[[0, 1, 2, 1][j % 4]] * (2 if j % 2 else 1), 0.3), t + j * beat / 2, 0.2)
    t += 4 * beat; bar += 1
music = sos(music, "low", 4500)
env = sos(np.abs(voice), "low", 6) * 5
music *= (1 - 0.65 * np.clip(env / 0.25, 0, 1)).astype(np.float32) * env_fade(N, 0.5, 0.0)

mix = voice * 0.85 + music * 0.2 + sfx * 0.5
mix *= env_fade(N, 0.0, 0.4)
pk = np.max(np.abs(mix))
if pk > 0.95: mix *= 0.95 / pk
sf.write(sys.argv[2], mix, SR)
print("mix done", round(dur, 2), "s peak", round(float(np.max(np.abs(mix))), 3))

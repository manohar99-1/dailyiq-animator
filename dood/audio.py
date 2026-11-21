"""Mix voice + synthesised SFX + ducked music. usage: audio.py DURATION out.wav"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

D = Path(__file__).parent
OUT = D / "out"
SR = 44100
dur = float(sys.argv[1])
N = int(dur * SR)
meta = json.loads((OUT / "timing_raw.json").read_text())
P = meta["phrases"]
rng = np.random.default_rng(7)


def place(buf, x, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0:
        return
    a = max(0, -i)
    b = min(len(x), len(buf) - i)
    buf[i + a:i + b] += x[a:b] * gain


def noise(n):
    return rng.standard_normal(n).astype(np.float32)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x).astype(np.float32)


def lp(x, fc):
    return sosfilt(butter(2, fc, btype="low", fs=SR, output="sos"), x).astype(np.float32)


def hp(x, fc):
    return sosfilt(butter(2, fc, btype="high", fs=SR, output="sos"), x).astype(np.float32)


def env_fade(n, a, r):
    e = np.ones(n, dtype=np.float32)
    ia, ir = int(a * SR), int(r * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ir: e[-ir:] = np.minimum(e[-ir:], np.linspace(1, 0, ir))
    return e


def whoosh_down(length=1.6):
    n = int(length * SR)
    x = noise(n)
    a = np.linspace(0.55, 0.015, n)
    y = np.zeros(n, dtype=np.float32)
    s = 0.0
    for i in range(n):          # time-varying one-pole low-pass: bright -> dark
        s += a[i] * (x[i] - s)
        y[i] = s
    f = np.linspace(1100, 90, n)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR).astype(np.float32) * 0.35
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    out = (y / (np.max(np.abs(y)) + 1e-9) * 0.8 + tone) * e
    return out.astype(np.float32)


def impact(length=1.4):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 38 + 60 * np.exp(-t * 7)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    burst = lp(noise(n), 400) * np.exp(-t * 14) * 3
    return ((boom * 1.0 + burst) * 0.9).astype(np.float32)


def blip(freq=880, length=0.12):
    n = int(length * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) * np.exp(-t * 28)).astype(np.float32)


def rumble(length):
    n = int(length * SR)
    x = lp(noise(n), 140)
    x = x / (np.max(np.abs(x)) + 1e-9)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 7 * np.arange(n) / SR)
    return (x * lfo * env_fade(n, 0.4, 1.6)).astype(np.float32)


def wind(length):
    n = int(length * SR)
    x = bp(noise(n), 500, 1100)
    x = x / (np.max(np.abs(x)) + 1e-9)
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.45 * np.arange(n) / SR)
    return (x * lfo * env_fade(n, 0.8, 1.2)).astype(np.float32)


def step_click():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    return (hp(noise(n), 1500) * np.exp(-t * 90)).astype(np.float32)


# ---------- SFX track ----------
sfx = np.zeros(N, dtype=np.float32)
F0 = P[0]["end"] + 0.03
SC = meta["scenes"]
S2 = SC["2"]["start"] - 0.4
place(sfx, blip(880), 0.9, 0.25)
place(sfx, whoosh_down(), F0, 0.9)
place(sfx, impact(), F0 + 1.6, 0.65)
place(sfx, rumble(3.6), S2, 0.5)
t = S2 + 0.5
step = np.pi / 5.2
k = 0
while t < dur:
    place(sfx, step_click(), t, 0.22)
    t += step
place(sfx, wind(min(dur - (S2 + 0.7), 5.0)), S2 + 0.7, 0.16)

# ---------- voice ----------
v, vsr = sf.read(str(OUT / "voice_final.wav"))
if v.ndim > 1:
    v = v.mean(axis=1)
assert vsr == SR, vsr
voice = np.zeros(N, dtype=np.float32)
m = min(N, len(v))
voice[:m] = v[:m]

# ---------- music: calm plucks + bass, ducked under the voice ----------
music = np.zeros(N, dtype=np.float32)
bpm = 100
beat = 60 / bpm
chords = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]), (130.81, [261.63, 329.63, 392.0]), (98.0, [196.0, 246.94, 293.66])]


def pluck(freq, length=0.5):
    n = int(length * SR)
    t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(4 * np.pi * freq * t) + 0.15 * np.sin(6 * np.pi * freq * t)) * np.exp(-t * 7)
    return y.astype(np.float32)


bar = 0
t = 0.0
while t < dur:
    root, tones = chords[bar % 4]
    place(music, pluck(root, 1.6) * 0.9, t, 0.5)
    for j in range(8):
        place(music, pluck(tones[[0, 1, 2, 1][j % 4]] * (2 if j >= 4 else 1), 0.45), t + j * beat / 2, 0.28)
    t += 4 * beat
    bar += 1
music = lp(music, 4500)
env = np.abs(voice)
env = lp(env, 6) * 5
duck = 1 - 0.65 * np.clip(env / 0.25, 0, 1)
music *= duck.astype(np.float32)
music *= env_fade(N, 0.5, 0.0)

mix = voice * 0.85 + music * 0.2 + sfx * 0.5
mix *= env_fade(N, 0.0, 0.4)
pk = np.max(np.abs(mix))
if pk > 0.95:
    mix *= 0.95 / pk
sf.write(sys.argv[2], mix, SR)
print("mix done", round(dur, 2), "s, peak", round(float(np.max(np.abs(mix))), 3))

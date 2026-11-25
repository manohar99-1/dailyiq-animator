"""Sound design for the GTA Short, keyed to the narration timing and to what is on screen.
usage: audio_gta.py DURATION out.wav"""
import json, sys
from pathlib import Path
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

D = Path(__file__).parent; OUT = D / "out"
SR = 44100
dur = float(sys.argv[1]); N = int(dur * SR)
meta = json.loads((OUT / "timing_raw.json").read_text()); P = meta["phrases"]
rng = np.random.default_rng(21)

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
def tt(n): return np.arange(n) / SR
def env_fade(n, a, r):
    e = np.ones(n, dtype=np.float32); ia, ir = int(a * SR), int(r * SR)
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ir: e[-ir:] = np.minimum(e[-ir:], np.linspace(1, 0, ir))
    return e
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def delay(x, d, g, reps=2):
    y = x.copy(); n = int(d * SR)
    for r in range(1, reps + 1):
        y = np.concatenate([y, np.zeros(n, dtype=np.float32)])[:len(y) + n]; y[r * n:] += 0
    out = np.zeros(len(x) + reps * n, dtype=np.float32); out[:len(x)] += x
    for r in range(1, reps + 1): out[r * n:r * n + len(x)] += x * g ** r
    return out

# ---------- one-shots ----------
def click():
    n = int(0.03 * SR); return sos(noise(n), "high", 2500) * np.exp(-tt(n) * 160)
def footstep(g=1.0):
    n = int(0.12 * SR); t = tt(n); f = 85 - 35 * (t / 0.12)
    th = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)
    return ((th * 0.9 + sos(noise(n), "high", 1800) * np.exp(-t * 110) * 0.5 + sos(noise(n), "band", (300, 900)) * np.exp(-t * 60) * 0.3) * g).astype(np.float32)
def swish(length=0.2):
    n = int(length * SR); return sos(noise(n), "band", (1500, 5000)) * np.sin(np.linspace(0, np.pi, n)) ** 2
def breath(length=0.55):
    n = int(length * SR); return sos(noise(n), "band", (700, 3200)) * np.sin(np.linspace(0, np.pi, n)) ** 1.5
def bonk():
    n = int(0.5 * SR); t = tt(n)
    wood = (np.sin(2 * np.pi * 760 * t) + 0.5 * np.sin(2 * np.pi * 1210 * t)) * np.exp(-t * 28)
    low = np.sin(2 * np.pi * np.cumsum(120 - 70 * np.minimum(1, t / 0.15)) / SR) * np.exp(-t * 9)
    return (wood * 0.5 + low * 1.0 + sos(noise(n), "low", 600) * np.exp(-t * 40) * 0.8).astype(np.float32)
def bwoop(length=0.4):
    n = int(length * SR); t = tt(n); f = 620 - 260 * (t / length) + 18 * np.sin(2 * np.pi * 9 * t)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * np.minimum(1, t * 60)).astype(np.float32)
def bloop(f0=420, f1=950, length=0.16):
    n = int(length * SR); t = tt(n); f = f0 + (f1 - f0) * (t / length)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)).astype(np.float32)
def ping(freq, length=0.5):
    n = int(length * SR); t = tt(n)
    x = (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2.76 * t)) * np.exp(-t * 7)
    return delay(x.astype(np.float32), 0.16, 0.4, 2)
def coin():
    n = int(0.5 * SR); t = tt(n)
    a = np.sin(2 * np.pi * 1568 * t) * np.exp(-t * 18) * (t < 0.06)
    b = np.sin(2 * np.pi * 2093 * np.maximum(t - 0.06, 0)) * np.exp(-np.maximum(t - 0.06, 0) * 8) * (t >= 0.06)
    return ((a + b) * 0.8).astype(np.float32)
def tick():
    n = int(0.04 * SR); return (np.sin(2 * np.pi * 1800 * tt(n)) * np.exp(-tt(n) * 120)).astype(np.float32)
def heartbeat():
    out = np.zeros(int(0.7 * SR), dtype=np.float32)
    for d, g in ((0.0, 1.0), (0.2, 0.75)):
        n = int(0.22 * SR); t = tt(n); th = np.sin(2 * np.pi * np.cumsum(62 - 18 * (t / 0.22)) / SR) * np.exp(-t * 16)
        out[int(d * SR):int(d * SR) + n] += th.astype(np.float32) * g
    return out
def pizz(freq):
    n = int(0.22 * SR); t = tt(n)
    return ((np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t)) * np.exp(-t * 20) * 0.7).astype(np.float32)
def wah(freq, length, glide=0.0):
    n = int(length * SR); t = tt(n); f = freq * (1 - glide * (t / length))
    ph = np.cumsum(f * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))) / SR
    saw = 2 * (ph % 1) - 1
    y = sos(saw.astype(np.float32), "low", 1100)
    return (y * np.minimum(1, t * 80) * np.exp(-np.maximum(t - length * 0.7, 0) * 10) * 0.55).astype(np.float32)
def riser(length):
    n = int(length * SR); x = noise(n); a = np.linspace(0.03, 0.6, n) ** 1.2; y = np.zeros(n, dtype=np.float32); s = 0.0
    for i in range(n): s += a[i] * (x[i] - s); y[i] = s
    t = tt(n); tone = np.sin(2 * np.pi * np.cumsum(180 * 2 ** (4 * t / length)) / SR) * 0.4
    return ((norm(y) * 0.8 + tone) * (t / length) ** 2).astype(np.float32)
def whoomph(length=1.8):
    n = int(length * SR); t = tt(n)
    boom = np.sin(2 * np.pi * np.cumsum(45 + 90 * np.exp(-t * 8)) / SR) * np.exp(-t * 2.2)
    burst = sos(noise(n), "low", 1800) * np.exp(-t * 6) * 1.6
    sp = np.zeros(n, dtype=np.float32)
    for j, f in enumerate([1568, 2093, 2637, 3136, 3951]):
        k = int((0.05 + j * 0.07) * SR); m = n - k
        sp[k:] += (np.sin(2 * np.pi * f * tt(m)) * np.exp(-tt(m) * 6) * 0.25).astype(np.float32)
    tail = sos(noise(n), "band", (400, 3000)) * np.exp(-t * 2.5) * 0.35
    return (boom * 0.9 + burst * 0.7 + sp + tail).astype(np.float32)
def stab(length=1.3):
    n = int(length * SR); t = tt(n); y = np.zeros(n, dtype=np.float32)
    for f in (196.0, 277.2, 370.0):
        ph = np.cumsum(np.full(n, f)) / SR; y += (2 * (ph % 1) - 1).astype(np.float32)
    y = sos(y, "low", 2200) * np.exp(-t * 3.2)
    boom = np.sin(2 * np.pi * np.cumsum(55 + 70 * np.exp(-t * 10)) / SR) * np.exp(-t * 5)
    return (y * 0.35 + boom * 0.8).astype(np.float32)
def siren(length, kind="wail"):
    n = int(length * SR); t = tt(n)
    if kind == "wail": f = 850 + 280 * np.sin(2 * np.pi * 0.7 * t)
    else: f = np.where((t * 2) % 2 < 1, 960, 770).astype(np.float64); f = sos(f.astype(np.float32), "low", 40)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.35 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return (sos(x.astype(np.float32), "low", 3500) * env_fade(n, 0.6, 0.5) * 0.5).astype(np.float32)
def chopper(length):
    n = int(length * SR); t = tt(n)
    pulse = np.maximum(0, np.sin(2 * np.pi * 11 * t)) ** 4
    return (sos(noise(n), "low", 260) * pulse * 2.2 * env_fade(n, 1.0, 0.5) * (0.5 + 0.5 * t / length)).astype(np.float32)
def radio(length):
    n = int(length * SR); g = np.zeros(n, dtype=np.float32); i = 0
    while i < n:
        on = int(rng.uniform(0.12, 0.45) * SR); off = int(rng.uniform(0.2, 0.7) * SR)
        g[i:i + on] = 1; i += on + off
    x = sos(noise(n), "band", (900, 3000)) * g
    for k in range(int(length * 1.5)): 
        s0 = int(rng.uniform(0, max(1, length - 0.2)) * SR); x[s0:s0 + int(0.08 * SR)] += np.sin(2 * np.pi * 1400 * tt(int(0.08 * SR))) * 0.5
    return (x * 0.6 * env_fade(n, 0.3, 0.3)).astype(np.float32)
def room_tone(length):
    n = int(length * SR); return sos(noise(n), "low", 220) * 0.5
def tv_game(length):
    n = int(length * SR); t = tt(n)
    eng = sos((2 * ((np.cumsum(60 + 25 * np.sin(2 * np.pi * 0.7 * t)) / SR) % 1) - 1).astype(np.float32), "low", 400) * 0.5
    notes = [220, 261.63, 329.63, 261.63, 196, 246.94, 293.66, 246.94]; beat = 60 / 140 / 2
    chip = np.zeros(n, dtype=np.float32)
    for j in range(int(length / beat) + 1):
        f = notes[j % 8]; m = int(beat * SR)
        sq = np.sign(np.sin(2 * np.pi * f * tt(m))).astype(np.float32) * np.exp(-tt(m) * 9) * 0.25
        i = int(j * beat * SR)
        if i < n: chip[i:i + m] += sq[:max(0, min(m, n - i))]
    return sos(eng + chip, "low", 3200) * env_fade(n, 0.2, 0.05)
def city_bed(length):
    n = int(length * SR); t = tt(n)
    rumble = sos(noise(n), "low", 180) * 1.6
    hiss = sos(noise(n), "band", (400, 2500)) * (0.10 + 0.05 * np.sin(2 * np.pi * 0.17 * t))
    crowd = sos(noise(n), "band", (300, 1400)) * (0.08 + 0.06 * np.abs(sos(noise(n), "low", 4)) * 10)
    return ((rumble + hiss + crowd) * env_fade(n, 1.2, 0.4)).astype(np.float32)
def car_pass(length=2.6):
    n = int(length * SR); t = tt(n); env = np.exp(-((t - length / 2) / (length / 4)) ** 2)
    eng = np.sin(2 * np.pi * np.cumsum(120 - 45 * (t / length)) / SR) * 0.35
    return ((eng + sos(noise(n), "low", 800) * 0.7) * env).astype(np.float32)
def horn():
    n = int(0.45 * SR); t = tt(n)
    x = np.sign(np.sin(2 * np.pi * 440 * t)) + np.sign(np.sin(2 * np.pi * 554 * t))
    return (sos(x.astype(np.float32), "low", 1500) * np.minimum(1, t * 50) * np.exp(-np.maximum(t - 0.3, 0) * 30) * 0.4).astype(np.float32)
# music bits
def kick():
    n = int(0.3 * SR); t = tt(n); return (np.sin(2 * np.pi * np.cumsum(45 + 110 * np.exp(-t * 22)) / SR) * np.exp(-t * 11)).astype(np.float32)
def snare():
    n = int(0.2 * SR); t = tt(n); return (sos(noise(n), "band", (1200, 5000)) * np.exp(-t * 24) * 0.9 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28) * 0.5).astype(np.float32)
def hat():
    n = int(0.04 * SR); return sos(noise(n), "high", 6500) * np.exp(-tt(n) * 110)
def pluck(freq, length=0.4):
    n = int(length * SR); t = tt(n)
    return ((np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(4 * np.pi * freq * t) + 0.12 * np.sin(6 * np.pi * freq * t)) * np.exp(-t * 8)).astype(np.float32)
MAJ = [(130.81, [261.63, 329.63, 392.0]), (110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]), (98.0, [196.0, 246.94, 293.66])]
MIN = [(110.0, [220.0, 261.63, 329.63]), (87.31, [174.61, 220.0, 261.63]), (73.42, [146.83, 174.61, 220.0]), (82.41, [164.81, 207.65, 246.94])]
def groove(buf, t0, t1, chords, bpm, tense):
    beat = 60 / bpm; t = t0; bar = 0
    while t < t1:
        root, tones = chords[bar % 4]
        for b in (0, 2): place(buf, kick(), t + b * beat, 0.9)
        if tense: place(buf, kick(), t + 3.5 * beat, 0.6)
        for b in (1, 3): place(buf, snare(), t + b * beat, 0.5)
        steps = 16 if tense else 8; sd = beat * 4 / steps
        for j in range(steps): place(buf, hat(), t + j * sd, 0.35 if j % 2 == 0 else 0.16)
        for k in (0, 1.5, 2, 3.5): place(buf, pluck(root, 0.45), t + k * beat, 0.7)
        for j in range(8): place(buf, pluck(tones[[0, 1, 2, 1][j % 4]] * (2 if j % 2 else 1), 0.3), t + j * beat / 2, 0.22)
        t += 4 * beat; bar += 1

# ---------- key moments from the narration / visuals ----------
F1 = W(0, "discovering") - 0.05; FL = F1 + 0.35; HUD0 = W(0, "turned") - 0.05
tS = meta["scenes"]["2"]["start"] - 0.4
bumpT = W(1, "bump") + 0.25; wantT = W(1, "wanted"); policeT = W(1, "police")
sandT = W(2, "sandwich"); broT = W(2, "bro"); end2 = P[2]["end"]
backT = wantT + 1.8; walkOffT = sandT + 0.9

sfx = np.zeros(N, dtype=np.float32)
amb = np.zeros(N, dtype=np.float32)
mus = np.zeros(N, dtype=np.float32)

# --- Scene 1: couch, TV game, flash ---
place(amb, room_tone(F1 + 0.1), 0, 0.5)
place(amb, tv_game(F1 + 0.05), 0, 0.55)
t = 0.5
while t < F1 - 0.25: place(sfx, click(), t, 0.22); t += 0.26 + 0.3 * rng.random()
place(sfx, swish(0.25), 1.1, 0.12)                                    # leans forward
gate = (np.sin(tt(int(0.45 * SR)) * 60 + (F1 - 0.45) * 60) > 0.2).astype(np.float32) * np.linspace(0.3, 1, int(0.45 * SR))
place(sfx, sos(noise(int(0.45 * SR)), "band", (900, 4200)) * gate, F1 - 0.45, 0.5)   # TV flicker buzz
place(sfx, riser(0.9), F1 - 0.85, 0.35)
place(sfx, whoomph(1.9), F1, 0.75)                                    # white flash
place(amb, city_bed(dur - FL + 1.0), FL - 1.0, 0.5)                   # the game world fades in
place(sfx, breath(0.5), FL + 0.45, 0.2)                               # he wakes up
place(sfx, swish(0.2), FL + 1.0, 0.14); place(sfx, swish(0.2), FL + 1.6, 0.14)   # looks left, right
place(sfx, bwoop(0.4), FL + 2.2, 0.28)                                # confused, looks at hands
place(amb, car_pass(2.8), FL + 0.4, 0.28); place(sfx, horn(), FL + 1.7, 0.12)
place(sfx, ping(1200, 0.6), HUD0, 0.3)                                # minimap
place(sfx, tick(), HUD0 + 0.2, 0.3); place(sfx, tick(), HUD0 + 0.27, 0.3)   # bars
place(sfx, coin(), HUD0 + 0.4, 0.35)                                  # cash
place(sfx, ping(880, 0.4), HUD0 + 0.6, 0.22)                          # stars
place(sfx, bloop(), HUD0 + 0.2, 0.22)                                 # player marker
place(sfx, swish(0.3), tS, 0.2)                                       # cut to the street

# --- Scene 2: walk, bump, wanted ---
place(amb, car_pass(2.6), tS + 3.2, 0.22)
t = tS + 0.2
while t < bumpT: place(sfx, footstep(), t, 0.3); t += 0.604
t = tS + 0.4
while t < bumpT: place(sfx, footstep(0.8), t, 0.22); t += 0.561
place(sfx, bonk(), bumpT, 0.7)
place(sfx, swish(0.18), bumpT + 0.05, 0.12)
place(sfx, riser(0.8), wantT - 0.8, 0.3)
place(sfx, stab(), wantT, 0.6)
place(sfx, bloop(500, 1300, 0.12), wantT + 0.02, 0.3)
place(sfx, ping(1319, 0.5), wantT + 0.03, 0.35); place(sfx, ping(1760, 0.5), wantT + 0.15, 0.35)
place(sfx, heartbeat(), wantT + 0.4, 0.55); place(sfx, heartbeat(), wantT + 1.2, 0.5)
for j, f in enumerate([988, 1319, 1760]): place(sfx, ping(f, 0.4), policeT + j * 0.12, 0.28)   # stars jump to 3
tail = dur - policeT
place(sfx, siren(tail + 0.5, "wail"), policeT - 0.1, 0.11)
place(sfx, siren(tail, "hilo"), policeT + 0.5, 0.07)
place(sfx, chopper(tail + 0.5), policeT - 0.3, 0.3)
place(sfx, radio(tail), policeT + 0.4, 0.12)
steps = [659, 587, 523, 494, 440, 392]
t = backT; j = 0
while t < broT - 0.1: place(sfx, pizz(steps[j % 6]), t, 0.3); place(sfx, footstep(0.5), t, 0.15); t += 0.748; j += 1   # tiptoeing backwards
place(sfx, swish(0.25), broT + 0.05, 0.18)                            # shrug
place(sfx, bloop(500, 900, 0.18), sandT, 0.25)                        # sandwich thought bubble
tw = end2 + 0.05
place(sfx, wah(233, 0.16), tw, 0.45); place(sfx, wah(220, 0.16), tw + 0.18, 0.45); place(sfx, wah(208, 0.3, 0.18), tw + 0.36, 0.45)   # sad trombone

# --- music: easy groove in the street, tense once the star appears ---
groove(mus, FL, wantT, MAJ, 100, False)
groove(mus, wantT, dur, MIN, 112, True)
mus = sos(mus, "low", 5000)

# --- voice + mix ---
v, vsr = sf.read(str(OUT / "voice_final.wav"))
if v.ndim > 1: v = v.mean(axis=1)
assert vsr == SR
voice = np.zeros(N, dtype=np.float32); m = min(N, len(v)); voice[:m] = v[:m]
env = sos(np.abs(voice), "low", 6) * 5
mus *= (1 - 0.65 * np.clip(env / 0.25, 0, 1)).astype(np.float32)
amb *= (1 - 0.3 * np.clip(env / 0.25, 0, 1)).astype(np.float32)
vm = np.abs(voice) > 0.02
rms = lambda x: float(np.sqrt(np.mean(x[vm] ** 2)))
print("stem rms while voice speaks  voice %.3f  music %.3f  amb %.3f  sfx %.3f" % (rms(voice), rms(mus * 0.28), rms(amb * 0.42), rms(sfx * 0.5)))
mix = voice * 1.0 + mus * 0.28 + amb * 0.42 + sfx * 0.5
mix *= env_fade(N, 0.0, 0.4)
pk = np.max(np.abs(mix))
if pk > 0.95: mix *= 0.95 / pk
sf.write(sys.argv[2], mix, SR)
print("mix done", round(dur, 2), "s peak", round(float(np.max(np.abs(mix))), 3))

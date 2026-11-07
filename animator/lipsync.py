"""Mouth movement for talking characters, derived from the real voice clip: one digit per video frame
('0' mouth closed, '1' open, '2' wide open / loud). Pure numpy, deterministic."""
import wave

import numpy as np


def _smooth(levels):
    """Remove 1-frame flickers so the mouth flaps at a natural syllable rate."""
    n = len(levels)
    op = [1 if v else 0 for v in levels]
    for i in range(1, n - 1):                       # fill 1-frame gaps inside speech
        if not op[i] and op[i - 1] and op[i + 1]:
            op[i] = 1
            levels[i] = 1
    for i in range(1, n - 1):                       # drop isolated 1-frame opens
        if op[i] and not op[i - 1] and not op[i + 1]:
            op[i] = 0
            levels[i] = 0
    return levels


def from_wav(path, fps):
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    hop = sr / fps
    n = int(np.ceil(len(x) / hop))
    rms = np.zeros(n, dtype=np.float32)
    win = int(hop * 1.6)
    for i in range(n):
        c = int((i + .5) * hop)
        seg = x[max(0, c - win // 2): c + win // 2]
        rms[i] = float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0
    ref = float(np.percentile(rms[rms > 1e-4], 90)) if (rms > 1e-4).any() else 1.0
    r = rms / max(ref, 1e-6)
    levels = [2 if v > .85 else 1 if v > .24 else 0 for v in r]
    return "".join(str(v) for v in _smooth(levels))


def fake(text, dur, fps):
    """Silent drafts: a syllable-ish flap pattern spread over the estimated speaking time."""
    n = int(dur * fps)
    syl = max(1, int(sum(len(w) / 3.0 + .6 for w in text.split())))
    out = []
    for i in range(n):
        u = i / max(1, n)
        ph = (u * syl) % 1.0
        out.append("2" if .1 < ph < .45 else "1" if .45 <= ph < .62 else "0")
    return "".join(out)

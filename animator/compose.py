"""Background music (synthesised here, nothing to license) and the final ffmpeg encode with voice + ducked music."""
import random
import subprocess
import wave

import numpy as np

SR = 44100


def make_music(path, dur, rms_dbfs=-34.0, seed=7):
    """Soft ambient pad + a few quiet bell notes. Deterministic for a given seed."""
    rng = np.random.default_rng(seed)
    rnd = random.Random(seed)
    n = int(SR * (dur + 1))
    t = np.arange(n) / SR
    L, R = np.zeros(n), np.zeros(n)
    hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
    chords = [(48, 52, 55, 59), (45, 48, 52, 55), (41, 45, 48, 52), (43, 47, 50, 52)]
    CL = 4.0
    for ci in range(int((dur + 1) / CL) + 1):
        for j, m in enumerate(chords[ci % 4]):
            for side, det in ((0, 0.998), (1, 1.002)):
                f = hz(m) * det
                seg = np.arange(int(SR * (CL + 3.0))) / SR
                env = np.minimum(seg / 1.4, 1.0) * np.exp(-np.maximum(seg - CL, 0) / 0.9)
                sig = (np.sin(2 * np.pi * f * seg) + .35 * np.sin(4 * np.pi * f * seg) + .12 * np.sin(6 * np.pi * f * seg)) * env * .11
                s0 = int(ci * CL * SR)
                if s0 >= n:
                    continue
                s1 = min(s0 + len(sig), n)
                (L if side == 0 else R)[s0:s1] += sig[: s1 - s0] * (.85 + .15 * (j % 2))
    tt = 1.0
    while tt < dur - 1:
        f = hz(rnd.choice([72, 74, 76, 79, 81, 84]))
        seg = np.arange(int(SR * 2.2)) / SR
        env = np.exp(-seg / .55) * np.minimum(seg / .01, 1.0)
        sig = (np.sin(2 * np.pi * f * seg) + .25 * np.sin(2 * np.pi * 2.76 * f * seg)) * env * .045
        s0 = int(tt * SR)
        s1 = min(s0 + len(sig), n)
        pan = rng.uniform(.25, .75)
        L[s0:s1] += sig[: s1 - s0] * (1 - pan) * 1.6
        R[s0:s1] += sig[: s1 - s0] * pan * 1.6
        tt += rnd.choice([1.5, 2.0, 2.5, 3.0])

    def echo(x, delay, fb, mix):
        d, y = int(delay * SR), x.copy()
        for k in range(1, 5):
            y[k * d:] += x[: n - k * d] * (fb ** k) * mix
        return y

    L, R = echo(L, .41, .5, .6), echo(R, .53, .5, .6)
    lfo = .9 + .1 * np.sin(2 * np.pi * t / 9.0)
    fade = np.minimum(t / 1.0, 1.0) * np.minimum((dur + 1 - t) / 1.5, 1.0)
    L, R = L * lfo * fade, R * lfo * fade
    g = (10 ** (rms_dbfs / 20)) / np.sqrt(np.mean(np.concatenate([L, R]) ** 2))
    pcm = (np.stack([L * g, R * g], 1) * 32767).clip(-32768, 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def encode(frames_dir, fps, voice_wav, music_wav, out_mp4, main_end, total, silent=False):
    """frames + voice (+ music ducked under the voice) -> H.264/AAC mp4. Music lifts after the narration ends (end card)."""
    inputs = ["-framerate", str(fps), "-i", f"{frames_dir}/f%05d.jpg", "-i", str(voice_wav)]
    if silent:
        voice = f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,apad=whole_dur={total:.3f}"
    else:
        voice = f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100,apad=whole_dur={total:.3f}"
    if music_wav:
        inputs += ["-i", str(music_wav)]
        fc = (f"{voice},asplit=2[vmix][vkey];"
              f"[2:a]atrim=0:{total:.3f},volume=1.4,volume='1+1*clip((t-{main_end:.3f})/1.0,0,1)':eval=frame[mus];"
              "[mus][vkey]sidechaincompress=threshold=0.06:ratio=3:attack=30:release=600:makeup=1[md];"
              "[vmix][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95,aresample=48000[aout]")
    else:
        fc = f"{voice},aresample=48000[aout]"
    cmd = ["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", fc, "-map", "0:v", "-map", "[aout]",
           "-t", f"{total:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(fps),
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out_mp4)]
    subprocess.run(cmd, check=True)

"""Narration: one text-to-speech clip per sentence (edge-tts neural voices, free). Exact clip lengths drive the whole timeline.
voice name "none" makes a silent draft (timings are estimated), handy for testing without internet."""
import asyncio
import concurrent.futures
import subprocess
import time
import wave
from pathlib import Path

SR = 44100


def _ff(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def _run_async(coro_fn, *a):
    """Run an async function even if an event loop is already running (Colab/Jupyter)."""
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
        return ex.submit(lambda: asyncio.run(coro_fn(*a))).result()


async def _edge_save(text, voice, rate, pitch, path):
    import edge_tts
    await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(path)


def _tts_clip(text, cfg, mp3, log):
    v = cfg["voice"]
    last = None
    for name in [v["name"]] + list(v.get("fallback_names", [])):
        for attempt in range(3):
            try:
                _run_async(_edge_save, text, name, v.get("rate", "+0%"), v.get("pitch", "+0Hz"), str(mp3))
                if Path(mp3).exists() and Path(mp3).stat().st_size > 1000:
                    return name
            except Exception as e:  # network hiccup, voice name typo...
                last = e
                time.sleep(1.5 * (attempt + 1))
        log(f"[voice] {name} failed ({type(last).__name__}); trying next voice")
    try:  # last resort: gTTS (Google), if installed
        from gtts import gTTS
        gTTS(text, lang="en", tld="co.in").save(str(mp3))
        return "gtts"
    except Exception as e:
        raise SystemExit(f"Text-to-speech failed ({last}; gTTS: {e}). Check internet access, or run with --voice none for a silent draft.")


def _wav_len(path):
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / w.getframerate()


def synthesize(spec, cfg, workdir, voice_name=None, log=print):
    """Returns a list of {wav: Path|None, dur: float} for each scene."""
    workdir = Path(workdir)
    workdir.mkdir(parents=True, exist_ok=True)
    silent = (voice_name or cfg["voice"]["name"]).lower() == "none"
    out = []
    for i, sc in enumerate(spec["scenes"]):
        say = sc["say"]
        if silent:
            out.append({"wav": None, "dur": max(1.4, len(say.split()) / 2.7)})
            continue
        mp3, wav = workdir / f"s{i:02d}.mp3", workdir / f"s{i:02d}.wav"
        used = _tts_clip(say, cfg, mp3, log)
        # trim leading/trailing silence and convert to 44.1 kHz mono wav
        trim = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04"
        _ff("-i", str(mp3), "-af", f"{trim},areverse,{trim},areverse", "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", str(wav))
        d = _wav_len(wav)
        log(f"[voice] scene {i + 1}/{len(spec['scenes'])}: {d:4.1f}s ({used})")
        out.append({"wav": wav, "dur": d})
    return out, silent

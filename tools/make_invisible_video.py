"""Invisible-24-hours Short with the approved expressive am_adam voice (v4): pitch and speed follow the mood of each phrase, no echo.
usage: python tools/make_invisible_video.py [--stills-only] [--workers N]"""
import json, shutil, subprocess, sys, time, wave
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import soundfile as sf
from kokoro_onnx import Kokoro
from animator import compose, config, render, spec as specmod, timeline
from animator.cli import slugify

SR = 44100
FRAC = float(sys.argv[sys.argv.index("--at") + 1]) if "--at" in sys.argv else 0.62
# (text, speed, pitch semitones, pause after) -- grouped per scene
SCENES = [
 [("What if you became invisible, for the next twenty four hours?", 1.0, 0.0, 0.5),
  ("Imagine waking up tomorrow, and discovering you've become invisible!", 1.0, +0.6, 0)],
 [("You've officially become a walking cheat code!", 1.05, +0.6, 0.45),
  ("No awkward conversations. No annoying people.", 1.05, 0.0, 0.4),
  ("And you can finally sneak into the kitchen at midnight, without anyone knowing.", 0.93, -0.7, 0)],
 [("Now imagine becoming a real-life ghost!", 1.0, +0.6, 0.5),
  ("You could walk into a dark room, slowly open the door, and whisper someone's name.", 0.88, -0.9, 0)],
 [("You could make objects float, switch on lights when nobody's around, or pull someone's chair just as they're about to sit down.", 1.07, +0.3, 0.5),
  ("Your friends would probably start looking for an exorcist!", 1.05, +0.8, 0)],
 [("Or imagine going to a restaurant. You pick up a burger, and it starts floating in mid-air.", 0.98, +0.2, 0.5),
  ("People would think they're witnessing a real ghost, and start running!", 1.1, +0.9, 0)],
 [("But here's the real question.", 0.9, -0.5, 0.6),
  ("If you really had the power to become invisible for twenty four hours, what would you do first?", 1.0, 0.0, 0.5),
  ("Would you become a ghost and prank everyone, or use your power for something completely different?", 1.0, +0.2, 0.55),
  ("Let me know in the comments!", 1.05, +0.7, 0)],
]

def _ff(*a): subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)

def build_voice(work):
    work.mkdir(parents=True, exist_ok=True)
    c = Path.home() / ".cache" / "dailyiq"
    k = Kokoro(str(c / "kokoro-v1.0.onnx"), str(c / "voices-v1.0.bin"))
    clips = []
    trim = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03"
    for si, phrases in enumerate(SCENES):
        parts = []
        for pi, (t, sp, pt, pause) in enumerate(phrases):
            r = 2 ** (pt / 12)           # pitch by resampling: clean, no echo
            s, sr = k.create(t, voice="am_adam", speed=sp / r, lang="en-us")
            raw, sh, g = work / f"r{si}{pi}.wav", work / f"s{si}{pi}.wav", work / f"g{si}{pi}.wav"
            sf.write(str(raw), s, int(round(sr * r)), format="WAV", subtype="FLOAT")
            _ff("-i", str(raw), "-af", f"{trim},areverse,{trim},areverse,aresample={SR}:resampler=soxr:precision=28,highpass=f=70,afade=t=in:d=0.01", "-ac", "1", "-c:a", "pcm_f32le", str(sh))
            parts.append(sh)
            if pause:
                _ff("-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", str(pause), "-c:a", "pcm_f32le", str(g)); parts.append(g)
        lst = work / f"l{si}.txt"; lst.write_text("".join(f"file '{p}'\n" for p in parts))
        wav = work / f"scene{si:02d}.wav"
        _ff("-f", "concat", "-safe", "0", "-i", str(lst), "-af", "volume=3dB", "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", str(wav))
        with wave.open(str(wav), "rb") as w: d = w.getnframes() / w.getframerate()
        clips.append({"wav": wav, "dur": d}); print(f"[voice] scene {si + 1}: {d:.1f}s")
    return clips

def main():
    stills = "--stills-only" in sys.argv
    workers = int(sys.argv[sys.argv.index("--workers") + 1]) if "--workers" in sys.argv else None
    cfg = config.load(None)
    raw = json.loads((ROOT / "examples" / "invisible.json").read_text(encoding="utf-8"))
    for sc, ph in zip(raw["scenes"], SCENES): sc["say"] = " ".join(p[0] for p in ph)
    sp = specmod.validate(raw)
    out = ROOT / "output" / slugify(sp["title"]); work = out / "work"; out.mkdir(parents=True, exist_ok=True)
    clips = build_voice(work / "voice")
    rt = timeline.build(sp, cfg, clips)
    fps = int(cfg["video"]["fps"])
    print(f"[timeline] narration {rt['T']:.1f}s + end card {rt['end']:.1f}s")
    if stills:
        spec_json = work / "stills_spec.json"; spec_json.write_text(json.dumps(rt, default=str), encoding="utf-8")
        for i, s in enumerate(rt["scenes"]):
            f = int((s["start"] + (s["end"] - s["start"]) * FRAC) * fps)
            subprocess.run([sys.executable, "-m", "animator.render_worker", str(spec_json), str(out / "stills"), str(f), str(f + 1), str(fps)], cwd=str(ROOT), check=True)
            p = out / "stills" / f"f{f:05d}.jpg"; shutil.move(p, out / "stills" / f"scene{i + 1}.jpg")
        return
    timeline.write_voice_track(rt, work / "voice.wav")
    total = rt["T"] + rt["end"]; music = None
    if cfg["video"]["music"]:
        music = work / "music.wav"; compose.make_music(music, total, rms_dbfs=-19.0 - float(cfg["video"]["music_volume_db_under_voice"]))
    n = render.render_frames(rt, work / "frames", fps, workers, print)
    mp4 = out / f"{slugify(sp['title'])}.mp4"
    compose.encode(work / "frames", fps, work / "voice.wav", music, mp4, rt["T"], n / fps, False, float(cfg["video"].get("loudness_lufs", -11)))
    print(f"[done] {mp4} {mp4.stat().st_size / 1e6:.1f} MB")

if __name__ == "__main__":
    main()

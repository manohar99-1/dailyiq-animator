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
def Y(s): return round(930 - 343 * s)          # y so that a person's feet stand on the floor line (930)
def person(who, x, s, m1, m2=None, **kw):
    d = {"who": who, "mood": m1, "mood2": m2 or m1, "act": "float", "pos": [x, Y(s), s]}; d.update(kw); return d
def prop(who, x, y, s, **kw):
    d = {"who": who, "mood": "happy", "mood2": "happy", "act": "float", "pos": [x, y, s]}; d.update(kw); return d
SURP = dict(brief=True)
# every shot = one narrated phrase: (text, speed, pitch semitones, pause after) + the picture for it
SHOTS = [
 {"v": ("What if you became invisible, for the next twenty four hours?", 1.0, 0.0, 0.3), "bg": "inv_bath", "at": .45,
  "cast": [person("hero", 360, 1.3, "worried", "shocked", **SURP)]},
 {"v": ("Imagine waking up tomorrow, and discovering you've become invisible!", 1.0, +0.6, 0.3), "bg": "inv_bed", "at": .5, "label": "INVISIBLE?!",
  "cast": [{"who": "invis", "mood": "happy", "mood2": "shocked", "act": "float", "pos": [360, 500, 1.3], "brief": True}, prop("blanket", 360, 735, 1.0, act="float")]},
 {"v": ("You've officially become a walking cheat code!", 1.05, +0.6, 0.3), "bg": "inv_street", "at": .5, "label": "CHEAT CODE",
  "cast": [person("friend", 590, 1.25, "cool", color="#2b2b36"), person("invis", 360, 1.25, "happy", act="swim", **{"from": "left", "to": "right", "walk": True, "start": .1, "end": .9})]},
 {"v": ("No awkward conversations. No annoying people.", 1.05, 0.0, 0.3), "bg": "inv_room", "at": .5,
  "cast": [person("friend", 190, 1.25, "happy"), prop("bubble", 250, 330, 1.0, text="BLAH BLAH BLAH"), person("invis", 400, 1.25, "happy", act="swim", **{"from": "base", "to": "right", "walk": True, "start": .3, "end": 1})]},
 {"v": ("And you can finally sneak into the kitchen at midnight, without anyone knowing.", 0.93, -0.7, 0.4), "bg": "inv_kitchen", "at": .5, "label": "MIDNIGHT SNACK",
  "cast": [person("invis", 215, 1.3, "happy"), prop("cake", 340, 690, .3)]},
 {"v": ("Now imagine becoming a real-life ghost!", 1.0, +0.6, 0.3), "bg": "inv_living", "at": .6, "label": "SCARE TIME",
  "cast": [person("friend", 150, 1.2, "happy", "shocked", act="shake", **SURP), person("hero", 330, 1.2, "happy", "shocked", act="shake", **SURP),
           person("invis", 560, 1.25, "happy", "boo", enter="right", delay=.3)]},
 {"v": ("You could walk into a dark room, slowly open the door, and whisper someone's name.", 0.88, -0.9, 0.4), "bg": "inv_dark", "at": .6,
  "cast": [person("friend", 230, 1.25, "worried", "scared", **SURP), person("invis", 520, 1.25, "happy", enter="right"), prop("bubble", 520, 330, 1.0, text="psst... Sam?")]},
 {"v": ("You could make objects float,", 1.07, +0.3, 0.15), "bg": "inv_living", "at": .5,
  "cast": [person("invis", 200, 1.25, "boo"), prop("coffee", 340, 610, .3), prop("book", 420, 700, 1.25), person("friend", 560, 1.2, "happy", "shocked", **SURP)]},
 {"v": ("switch on lights when nobody's around,", 1.07, +0.3, 0.15), "bg": "inv_dark", "at": .45,
  "cast": [prop("lamp", 200, 755, 1.25, mood="happy", mood2="boo"), person("invis", 400, 1.25, "happy"), person("friend", 590, 1.2, "worried", "shocked", **SURP)]},
 {"v": ("or pull someone's chair just as they're about to sit down.", 1.07, +0.3, 0.3), "bg": "inv_room", "at": .55,
  "cast": [person("friend", 330, 1.25, "happy", "shocked", act="fall", **SURP), person("invis", 560, 1.25, "happy"),
           prop("chair", 330, 930, 1.25, act="swim", **{"from": "base", "to": "left", "walk": True, "start": .4, "end": .75})]},
 {"v": ("Your friends would probably start looking for an exorcist!", 1.05, +0.8, 0.3), "bg": "inv_room", "at": .45, "label": "CALL THE EXORCIST",
  "cast": [person("friend", 130, 1.0, "worried", "scared", **SURP), person("hero", 300, 1.0, "worried", "scared", **SURP), person("priest", 560, 1.15, "determined", enter="right", delay=.2)]},
 {"v": ("Or imagine going to a restaurant. You pick up a burger, and it starts floating in mid-air.", 0.98, +0.2, 0.3), "bg": "inv_restaurant", "at": .6, "label": "FLOATING BURGER",
  "cast": [person("friend", 190, 1.25, "happy", "shocked", **SURP), person("invis", 540, 1.25, "boo"), prop("burger", 420, 735, .28), prop("table", 360, 850, 1.25)]},
 {"v": ("People would think they're witnessing a real ghost, and start running!", 1.1, +0.9, 0.3), "bg": "inv_restaurant", "at": .3,
  "cast": [person("friend", 170, 1.25, "happy", "scared", **{"brief": True, "act": "swim", "from": "base", "to": "left", "walk": True, "start": .3, "end": 1}),
           person("hero", 540, 1.25, "happy", "scared", **{"brief": True, "act": "swim", "from": "base", "to": "right", "walk": True, "start": .3, "end": 1}),
           person("invis", 360, 1.25, "happy"), prop("burger", 360, 720, .28), prop("table", 360, 850, 1.25)]},
 {"v": ("But here's the real question.", 0.9, -0.5, 0.4), "bg": "inv_comments", "at": .5,
  "cast": [person("invis", 360, 2.0, "thinking")]},
 {"v": ("If you really had the power to become invisible for twenty four hours, what would you do first?", 1.0, 0.0, 0.3), "bg": "inv_comments", "at": .5,
  "cast": [person("invis", 360, 1.3, "thinking"), prop("bubble", 360, 260, 1.6, text="24:00:00")]},
 {"v": ("Would you become a ghost and prank everyone, or use your power for something completely different?", 1.0, +0.2, 0.3), "bg": "inv_comments", "at": .45,
  "cast": [person("friend", 140, 1.0, "worried", "scared", **SURP), person("invis", 340, 1.25, "happy", "boo"), prop("gift", 590, 700, 1.7)]},
 {"v": ("Let me know in the comments!", 1.05, +0.7, 0.0), "bg": "inv_comments", "at": .5,
  "cast": [person("invis", 360, 1.3, "happy", act="hop"), prop("bubble", 360, 300, 1.5, text="COMMENT BELOW!")]},
]
SCENES = [[x["v"]] for x in SHOTS]

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
    raw = {"title": "What If You Became Invisible for 24 Hours? 👻", "description": "You wake up invisible for 24 hours. Pranks, snacks, floating burgers... what would you do first? Tell us in the comments!\n#shorts #whatif #invisible #funny",
           "hashtags": ["#shorts", "#whatif", "#invisible", "#funny"], "look": {"frame": "wide", "clean": True},
           "scenes": [{"say": x["v"][0].rstrip(", "), "type": "toon", "data": dict(cast=x["cast"], at=x["at"], layout="auto", bg=x["bg"], **({"label": x["label"]} if x.get("label") else {}))} for x in SHOTS]}
    if "--write-spec" in sys.argv: (ROOT / "examples" / "invisible.json").write_text(json.dumps(raw, ensure_ascii=False, indent=1), encoding="utf-8")
    sp = specmod.validate(raw, max_scenes=30)
    out = ROOT / "output" / slugify(sp["title"]); work = out / "work"; out.mkdir(parents=True, exist_ok=True)
    clips = build_voice(work / "voice")
    rt = timeline.build(sp, cfg, clips)
    fps = int(cfg["video"]["fps"])
    print(f"[timeline] narration {rt['T']:.1f}s + end card {rt['end']:.1f}s")
    if stills:
        spec_json = work / "stills_spec.json"; spec_json.write_text(json.dumps(rt, default=str), encoding="utf-8")
        only = [int(v) for v in sys.argv[sys.argv.index("--only") + 1].split(",")] if "--only" in sys.argv else None
        for i, s in enumerate(rt["scenes"]):
            if only and (i + 1) not in only: continue
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

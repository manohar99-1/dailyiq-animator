"""Command line:   python -m animator.cli generate --topic "What if UPI stopped working?"
                  python -m animator.cli generate --spec examples/google.json --voice none      (silent draft, no internet needed)"""
import argparse
import json
import re
import shutil
import sys
import time
from pathlib import Path

from . import compose, config, llm, notify, render, spec as specmod, timeline, voice


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:50] or "video"


def generate(args):
    t0 = time.time()
    cfg = config.load(args.config)
    log = print
    if args.spec:
        raw = json.loads(Path(args.spec).read_text(encoding="utf-8"))
        sp = specmod.validate(raw)
        log(f"[spec] loaded {args.spec}: {len(sp['scenes'])} scenes")
    elif args.topic:
        sp = llm.generate_spec(args.topic, cfg, log)
    else:
        raise SystemExit("Give --topic \"...\" or --spec file.json")

    out_root = Path(args.out)
    out = out_root / slugify(sp["title"])
    work = out / "work"
    out.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)
    (out / "spec.json").write_text(json.dumps(sp, indent=2, ensure_ascii=False), encoding="utf-8")

    clips, silent = voice.synthesize(sp, cfg, work / "voice", args.voice, log)
    rt = timeline.build(sp, cfg, clips)
    log(f"[timeline] narration {rt['T']:.1f}s + end card {rt['end']:.1f}s")
    timeline.write_voice_track(rt, work / "voice.wav")
    total = rt["T"] + rt["end"]

    music = None
    if cfg["video"]["music"] and not args.no_music:
        music = work / "music.wav"
        compose.make_music(music, total, rms_dbfs=(-21.0 if silent else -19.0 - float(cfg["video"]["music_volume_db_under_voice"])))

    fps = int(cfg["video"]["fps"])
    n = render.render_frames(rt, work / "frames", fps, args.workers, log)
    mp4 = out / f"{slugify(sp['title'])}.mp4"
    compose.encode(work / "frames", fps, work / "voice.wav", music, mp4, rt["T"], n / fps, silent, float(cfg['video'].get('loudness_lufs', -11)))
    thumb_src = work / "frames" / f"f{min(n - 1, int(1.2 * fps)):05d}.jpg"
    if thumb_src.exists():
        shutil.copy(thumb_src, out / "thumbnail.jpg")

    tags = " ".join(sp["hashtags"])
    meta = {"title": sp["title"], "description": sp["description"], "hashtags": sp["hashtags"],
            "youtube_description": f"{sp['description']}\n\n{tags}".strip(), "duration_seconds": round(n / fps, 1),
            "upload_checklist": ["Visibility: Public", "Audience: Not made for kids", "Altered/synthetic content: Yes (AI-generated voice)"]}
    (out / "metadata.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    if not args.keep_work:
        shutil.rmtree(work, ignore_errors=True)
    log(f"[done] {mp4}  ({meta['duration_seconds']}s, {mp4.stat().st_size / 1e6:.1f} MB) in {time.time() - t0:.0f}s")
    if args.notify:
        notify.send_telegram(mp4, f"{sp['title']}\n\n{meta['youtube_description']}", log)
    print(f"::output::{mp4}")
    return mp4


def main(argv=None):
    ap = argparse.ArgumentParser(prog="animator", description="Topic in, animated Short out.")
    sub = ap.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("generate", help="make a video")
    g.add_argument("--topic", help='what the video is about, e.g. "What if UPI stopped working?"')
    g.add_argument("--spec", help="use your own spec JSON instead of asking an LLM (see examples/)")
    g.add_argument("--out", default="output", help="output folder (default: output)")
    g.add_argument("--voice", help='override the voice, e.g. en-IN-PrabhatNeural, or "none" for a silent draft')
    g.add_argument("--config", help="path to a config.json")
    g.add_argument("--no-music", action="store_true")
    g.add_argument("--notify", action="store_true", help="send the result to Telegram if TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID are set")
    g.add_argument("--keep-work", action="store_true", help="keep frames and audio parts (for debugging)")
    g.add_argument("--workers", type=int, help="parallel render workers (default: CPU count, max 4)")
    args = ap.parse_args(argv)
    if args.cmd == "generate":
        generate(args)


if __name__ == "__main__":
    main()

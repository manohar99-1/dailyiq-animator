"""Runs several render workers in parallel and checks that every frame exists."""
import json
import math
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def render_frames(rt, frames_dir, fps, workers=None, log=print):
    frames_dir = Path(frames_dir)
    frames_dir.mkdir(parents=True, exist_ok=True)
    for old in frames_dir.glob("f*.jpg"):
        old.unlink()
    spec_json = frames_dir / "render_spec.json"
    spec_json.write_text(json.dumps({k: v for k, v in rt.items()}, default=str), encoding="utf-8")
    total = int(math.ceil((rt["T"] + rt["end"]) * fps))
    n = max(1, min(workers or (os.cpu_count() or 2), 4, total))
    cuts = [round(total * i / n) for i in range(n + 1)]
    log(f"[render] {total} frames with {n} worker(s)")
    procs = [subprocess.Popen([sys.executable, "-m", "animator.render_worker", str(spec_json), str(frames_dir), str(cuts[i]), str(cuts[i + 1]), str(fps)],
                              cwd=str(ROOT)) for i in range(n)]
    codes = [p.wait() for p in procs]
    have = len(list(frames_dir.glob("f*.jpg")))
    if any(codes) or have != total:
        raise SystemExit(f"Rendering failed: exit codes {codes}, frames {have}/{total}")
    return total

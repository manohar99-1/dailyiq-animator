"""Renders a range of frames with headless Chromium.   usage: python -m animator.render_worker SPEC.json OUTDIR START END FPS"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ENGINE = Path(__file__).resolve().parent / "engine" / "engine.html"


def main():
    spec_path, outdir, a, b, fps = sys.argv[1], Path(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    outdir.mkdir(parents=True, exist_ok=True)
    errs = []
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page(viewport={"width": 720, "height": 1280}, device_scale_factor=1.5)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(ENGINE.as_uri())
        pg.evaluate("s => window.loadSpec(s)", spec)
        for i in range(a, b):
            pg.evaluate("([t, f]) => window.render(t, f)", [i / fps, i])
            pg.screenshot(path=str(outdir / f"f{i:05d}.jpg"), type="jpeg", quality=92)
        br.close()
    if errs:
        print("JS messages:", sorted(set(errs))[:6], file=sys.stderr)
    print(f"worker done {a}-{b}")


if __name__ == "__main__":
    main()

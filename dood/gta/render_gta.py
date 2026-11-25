"""`render_gta.py stills t1 t2 ...` -> out/still_*.png ; `render_gta.py video t0 t1 out.mp4`"""
import subprocess, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

D = Path(__file__).parent
OUT = D / "out"
(D / "timing.js").write_text("window.TIMING=" + (OUT / "timing_raw.json").read_text() + ";")

mode = sys.argv[1]
with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 720, "height": 1280}, device_scale_factor=1)
    pg.on("console", lambda m: print("console:", m.text))
    pg.on("pageerror", lambda e: print("PAGEERROR:", e))
    pg.goto("file://" + str(D / "gta.html"))
    pg.evaluate("document.fonts.load('900 40px InterX')")
    pg.evaluate("document.fonts.load('800 40px InterX')")
    pg.wait_for_timeout(400)
    if mode == "stills":
        for a in sys.argv[2:]:
            pg.evaluate(f"renderFrame({float(a)})")
            pg.screenshot(path=str(OUT / f"still_{float(a):05.2f}.png"))
            print("still", a)
    else:
        t0, t1, out = float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
        fps, n = 30, int(round((t1 - t0) * 30))
        tmp = out + ".part.mp4"
        ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
                               "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", tmp],
                              stdin=subprocess.PIPE)
        for i in range(n):
            pg.evaluate(f"renderFrame({t0 + i / fps})")
            ff.stdin.write(pg.screenshot(type="jpeg", quality=92))
        ff.stdin.close()
        if ff.wait() == 0:
            Path(tmp).rename(out)
        print("frames", n)
    b.close()

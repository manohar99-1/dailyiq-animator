"""Make a short sample clip for many neural voices so you can listen and pick one:   python -m animator.voice_samples [out_dir]
Then use the chosen name in the workflow's "voice" box (or in config.json)."""
import asyncio
import sys
from pathlib import Path

TEXT = "What if the Moon disappeared tomorrow? Our nights would become much darker, and the ocean tides would shrink. But do not worry, the Moon is not going anywhere."
PREFERRED = ["en-IN-NeerjaExpressiveNeural", "en-IN-NeerjaNeural", "en-IN-PrabhatNeural", "en-US-AvaMultilingualNeural", "en-US-AndrewMultilingualNeural",
             "en-US-BrianMultilingualNeural", "en-US-EmmaMultilingualNeural", "en-US-AriaNeural", "en-US-GuyNeural", "en-US-JennyNeural",
             "en-GB-SoniaNeural", "en-GB-RyanNeural", "en-AU-NatashaNeural", "en-AU-WilliamNeural"]


async def main(out):
    import edge_tts
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    avail = {v["ShortName"] for v in await edge_tts.list_voices()}
    names = [n for n in PREFERRED if n in avail]
    print("available english voices:", ", ".join(sorted(n for n in avail if n.startswith("en-"))))
    for n in names:
        try:
            await edge_tts.Communicate(TEXT, n, rate="+0%").save(str(out / f"{n}.mp3"))
            print("ok", n)
        except Exception as e:
            print("failed", n, type(e).__name__)


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "voice_samples"))

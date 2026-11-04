"""Optional: send the finished video to your Telegram chat (set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)."""
import os
import urllib.parse
import urllib.request
import uuid
from pathlib import Path


def send_telegram(video_path, caption, log=print):
    token, chat = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip(), os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat:
        return False
    video_path = Path(video_path)
    try:
        if video_path.stat().st_size < 49 * 1024 * 1024:
            b = uuid.uuid4().hex
            parts = []
            for k, v in (("chat_id", chat), ("caption", caption[:1000]), ("supports_streaming", "true")):
                parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
            parts.append(f'--{b}\r\nContent-Disposition: form-data; name="video"; filename="{video_path.name}"\r\nContent-Type: video/mp4\r\n\r\n'.encode())
            parts += [video_path.read_bytes(), f"\r\n--{b}--\r\n".encode()]
            req = urllib.request.Request(f"https://api.telegram.org/bot{token}/sendVideo", data=b"".join(parts),
                                         headers={"Content-Type": f"multipart/form-data; boundary={b}"}, method="POST")
        else:
            data = urllib.parse.urlencode({"chat_id": chat, "text": "Video ready (too large for Telegram upload): " + caption[:500]}).encode()
            req = urllib.request.Request(f"https://api.telegram.org/bot{token}/sendMessage", data=data, method="POST")
        urllib.request.urlopen(req, timeout=180).read()
        log("[notify] sent to Telegram")
        return True
    except Exception as e:
        log(f"[notify] Telegram failed: {type(e).__name__}: {str(e)[:100]}")
        return False

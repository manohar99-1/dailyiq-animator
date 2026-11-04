# DailyIQ Animator

Type a topic, get a finished animated YouTube Short (1080x1920, narrated, captioned, with DailyIQ end card).

```
topic -> AI writes script + scenes -> neural voice -> animated scenes -> mp4
```

## Run it from your phone (GitHub Actions)

1. Create a free API key at one of: Groq (console.groq.com), OpenRouter (openrouter.ai) or Google AI Studio.
2. In this repo: **Settings -> Secrets and variables -> Actions -> New repository secret**. Add `GROQ_API_KEY` (or `OPENROUTER_API_KEY` / `GEMINI_API_KEY`).
3. **Actions -> Generate video -> Run workflow**, type your topic, run.
4. After ~10 minutes the video appears under **Releases** (download the mp4 + metadata). It is also in the run's Artifacts.
5. Optional: add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` secrets and the video is sent to your Telegram chat too.

## Run it in Google Colab

Open `colab/DailyIQ_Animator.ipynb` in Colab, edit the repo URL in the Setup cell, paste a key, run the cells.

## Run it on a computer

```
pip install -r requirements.txt
python -m playwright install chromium     # needs ffmpeg installed too
python -m animator.cli generate --topic "What if UPI stopped working?"
```

No internet or key? Try a silent draft from a ready-made script:
`python -m animator.cli generate --spec examples/showcase.json --voice none`

## Customise

- `config.json`: channel name/handle, voice (`en-IN-NeerjaNeural`, `en-IN-PrabhatNeural`...), music, length, LLM models.
- `examples/*.json`: write your own scripts (scene types: hook, searchbar, flow, network, hub, grid, counter, compare, steps, alert, bars, collapse, keypoints).
- New scene types: add a function in `animator/engine/scenes.js` and its name to `animator/spec.py`.

Notes: free LLM model names change; edit `config.json` if one stops working. Upload checklist is saved in `metadata.json` (mark as AI-generated/synthetic on YouTube).

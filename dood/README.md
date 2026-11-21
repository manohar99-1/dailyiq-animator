# Dood Shorts kit (stick-figure host, code-drawn SVG)

Every frame is an SVG built from time `t` in `dood.js` (`frame(t)`), screenshotted in headless Chromium and piped to ffmpeg. Motion is formulas of time (ease, pop, lerp, sin). Poses and effects are timed to the narration timing JSON.

Format: 9:16, 720x1280, 30 fps. Voice: Kokoro `am_adam`, one clip per phrase. Captions: word-by-word, white with the current word yellow, navy outline.

## Per video (run inside `dood/`)
1. Edit `PHRASES` in `voice_build.py` (scene, text, speed, pitch, volume, pause) and run `python3 voice_build.py out`. Normalise loudness to about -14 LUFS (see the ffmpeg loudnorm step used for `voice_final.wav`).
2. Write the scenes in `dood.js` (`SCENES = {1: scene1, ...}`), anchored to phrase and word times from `TIMING`.
3. `python3 render.py stills 2.5 5.0` to inspect frames, then `python3 render.py video 0 10.9 out/sample.mp4`.
4. `python3 audio.py 10.9 out/sample_audio.wav` mixes voice, synthesised SFX and ducked music; mux with ffmpeg.

Needs: `pip install kokoro-onnx soundfile playwright scipy numpy`, ffmpeg, Chromium. Kokoro model files download from the kokoro-onnx GitHub release into `~/.cache/dailyiq/`.

Status: "What if you became smaller than an ant?" has scenes 1-2 built; scenes 3-6 and the end card are still to do.

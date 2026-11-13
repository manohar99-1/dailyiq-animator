import subprocess
from pathlib import Path
import soundfile as sf
from kokoro_onnx import Kokoro
c=Path.home()/".cache"/"dailyiq"
k=Kokoro(str(c/"kokoro-v1.0.onnx"),str(c/"voices-v1.0.bin"))
import sys; out=Path(sys.argv[1] if len(sys.argv)>1 else 'voice_out'); out.mkdir(parents=True, exist_ok=True)
P=[
("What if you became invisible, for the next twenty four hours?",1.0,0.0,0.5),
("Imagine waking up tomorrow, and discovering you've become invisible!",1.0,+0.6,0.7),
("You've officially become a walking cheat code!",1.05,+0.6,0.45),
("No awkward conversations. No annoying people.",1.05,0.0,0.4),
("And you can finally sneak into the kitchen at midnight, without anyone knowing.",0.93,-0.7,0.8),
("Now imagine becoming a real-life ghost!",1.0,+0.6,0.5),
("You could walk into a dark room, slowly open the door, and whisper someone's name.",0.88,-0.9,0.8),
("You could make objects float, switch on lights when nobody's around, or pull someone's chair just as they're about to sit down.",1.07,+0.3,0.5),
("Your friends would probably start looking for an exorcist!",1.05,+0.8,0.8),
("Or imagine going to a restaurant. You pick up a burger, and it starts floating in mid-air.",0.98,+0.2,0.5),
("People would think they're witnessing a real ghost, and start running!",1.1,+0.9,0.8),
("But here's the real question.",0.9,-0.5,0.6),
("If you really had the power to become invisible for twenty four hours, what would you do first?",1.0,0.0,0.5),
("Would you become a ghost and prank everyone, or use your power for something completely different?",1.0,+0.2,0.55),
("Let me know in the comments!",1.05,+0.7,0.2),
]
parts=[]
for i,(t,sp,pt,pause) in enumerate(P):
    r=2**(pt/12)                       # clean pitch shift by resampling (no phase vocoder = no echo)
    s,sr=k.create(t,voice="am_adam",speed=sp/r,lang="en-us")
    raw=out/f"r{i:02d}.wav"; sf.write(str(raw),s,int(round(sr*r)),format="WAV",subtype="FLOAT")
    sh=out/f"s{i:02d}.wav"
    trim="silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03"
    chain=[trim,"areverse",trim,"areverse","aresample=48000:resampler=soxr:precision=28","highpass=f=70","afade=t=in:d=0.01"]
    subprocess.run(["ffmpeg","-v","error","-y","-i",str(raw),"-af",",".join(chain),"-ac","1","-c:a","pcm_f32le",str(sh)],check=True)
    g=out/f"g{i:02d}.wav"
    subprocess.run(["ffmpeg","-v","error","-y","-f","lavfi","-i","anullsrc=r=48000:cl=mono","-t",str(pause),"-c:a","pcm_f32le",str(g)],check=True)
    parts+=[sh,g]
lst=out/'list.txt'; lst.write_text("".join(f"file '{p}'\n" for p in parts[:-1]))
cat=out/'cat.wav'
subprocess.run(["ffmpeg","-v","error","-y","-f","concat","-safe","0","-i",str(lst),"-c:a","pcm_f32le",str(cat)],check=True)
# static gain only (no dynamic processing) to about -14 LUFS
m=subprocess.run(["ffmpeg","-hide_banner","-i",str(cat),"-af","loudnorm=I=-14:TP=-1.5:print_format=json","-f","null","-"],capture_output=True,text=True).stderr
import json,re
j=json.loads(m[m.rindex('{'):])
gain=-14-float(j["input_i"])
subprocess.run(["ffmpeg","-v","error","-y","-i",str(cat),"-af",f"volume={gain:.2f}dB,alimiter=limit=0.89","-c:a","libmp3lame","-b:a","256k",str(out/"invisible_voiceover_am_adam_v4.mp3")],check=True)
print("gain",round(gain,2))

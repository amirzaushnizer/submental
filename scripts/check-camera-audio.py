import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / 'data/camera/catalog.json').read_text())
MODEL = os.environ.get('ORBIT_ASR_MODEL', 'base.en')


def check_audio():
    model = WhisperModel(MODEL, device='cpu', compute_type='int8', download_root=os.environ.get('ORBIT_ASR_CACHE'))
    output = {'schemaVersion': 1, 'model': f'Whisper {MODEL}', 'runtime': 'faster-whisper, local CPU', 'generatedAt': datetime.now(timezone.utc).isoformat(), 'method': 'ASR locates dialogue; source turns are linked by the spoken exchange and neighboring replies. NASA wording is retained in captions. No global video-offset match is used. ASR may mishear noisy radio words.', 'clips': {}}
    for clip in CATALOG['clips']:
        if not clip.get('spokenTurns'):
            continue
        file = ROOT / 'assets/camera' / (clip['id'] + '.mp4')
        raw = subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(), '-loglevel', 'error', '-i', str(file), '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'])
        segments, _ = model.transcribe(np.frombuffer(raw, dtype=np.float32), language='en', beam_size=5, word_timestamps=True)
        segments = [{'start': float(s.start), 'end': float(s.end), 'text': s.text, 'words': [{'word': w.word, 'start': float(w.start), 'end': float(w.end)} for w in s.words]} for s in segments]
        output['clips'][clip['id']] = {'videoSha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'sourceOffsetSeconds': clip['sourceOffsetSeconds'], 'spokenTurns': clip['spokenTurns'], 'segments': segments}
        print(clip['id'], [(s['start'], s['end'], s['text']) for s in segments], flush=True)
    (ROOT / 'data/camera/audio-alignment.json').write_text(json.dumps(output, indent=2) + '\n')


if __name__ == '__main__':
    check_audio()

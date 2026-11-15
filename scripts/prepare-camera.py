import concurrent.futures
import json
import subprocess
from pathlib import Path
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
CLIPS = json.loads((ROOT / 'data/camera/catalog.json').read_text())['clips']
DESTINATION = ROOT / 'assets/camera'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def extract(clip):
    destination = DESTINATION / (clip['id'] + '.mp4')
    subprocess.run([
        FFMPEG, '-hide_banner', '-loglevel', 'error', '-ss', str(clip['sourceOffsetSeconds']),
        '-i', clip['mediaUrl'], '-t', str(clip['durationSeconds']), '-vf', 'scale=640:-2',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '25', '-c:a', 'aac', '-b:a', '64k',
        '-movflags', '+faststart', '-y', str(destination),
    ], check=True)
    for index, second in enumerate(clip['frameSeconds']):
        subprocess.run([
            FFMPEG, '-hide_banner', '-loglevel', 'error', '-ss', str(second), '-i', str(destination),
            '-frames:v', '1', '-q:v', '3', '-y', str(DESTINATION / f"{clip['id']}-{index}.jpg"),
        ], check=True)
    if clip.get('spokenTurns'):
        def stamp(seconds):
            milliseconds = round(seconds * 1000)
            return f"{milliseconds // 3600000:02}:{milliseconds // 60000 % 60:02}:{milliseconds // 1000 % 60:02}.{milliseconds % 1000:03}"
        cues = ['WEBVTT', '']
        for turn in clip['spokenTurns']:
            cues.extend([f"{stamp(turn['startSeconds'])} --> {stamp(turn['endSeconds'])}", turn['quote'], ''])
        (DESTINATION / (clip['id'] + '.vtt')).write_text('\n'.join(cues) + '\n')
    print(clip['id'], 'prepared', flush=True)


if __name__ == '__main__':
    DESTINATION.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        list(pool.map(extract, CLIPS))

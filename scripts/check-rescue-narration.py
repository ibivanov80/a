"""Verify the 300 spoken riddles and answers as resolved by the game."""
import argparse
import base64
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
DENIS = '0BcDz9UPwL3MpsnTeUlO'


def check_recording(item):
    relative_path, expected_text = item
    path = (DOCS / relative_path).resolve()
    if not path.is_relative_to(DOCS) or not path.is_file():
        raise ValueError(f'Missing local recording: {relative_path}')
    metadata = subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,codec_type:format=duration',
        '-of', 'json', str(path)
    ])
    info = json.loads(metadata)
    streams = [(s['codec_type'], s['codec_name']) for s in info['streams']]
    if streams != [('audio', 'aac')] or float(info['format']['duration']) <= 0:
        raise ValueError(f'Invalid AAC recording: {relative_path}')
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-xerror', '-threads', '1',
                    '-i', str(path), '-map', '0:a:0', '-f', 'null', '-'], check=True)
    return relative_path, expected_text, hashlib.sha256(path.read_bytes()).hexdigest()


def verify_offline(path, published):
    pending = set(published)
    pattern = re.compile(rb'<script type="application/octet-stream" id="asset-([^"]+)" data-mime="audio/mp4">([A-Za-z0-9+/=]+)</script>')
    with path.open('rb') as src:
        for line in src:
            if b'data-mime="audio/mp4"' not in line:
                continue
            match = pattern.fullmatch(line.strip())
            if not match:
                continue
            name = match[1].decode('ascii')
            if name not in published:
                continue
            digest = hashlib.sha256(base64.b64decode(match[2], validate=True)).hexdigest()
            if name not in pending or digest != published[name]:
                raise ValueError(f'Incorrect or repeated offline recording: {name}')
            pending.remove(name)
    if pending:
        raise ValueError(f'Missing {len(pending)} offline recordings, including {min(pending)}.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', type=Path, help='Compare the same recordings in the exported HTML.')
    args = parser.parse_args()
    plan = json.loads((ROOT / 'rescue-narration-plan.json').read_text())
    if plan['voiceId'] != DENIS or plan['language'] != 'ru':
        raise ValueError('Expected the Russian Denis voice.')
    script = """
        import {tasks} from './docs/rescue-data.js';
        import {rescueClip, rescuePrompt} from './docs/rescue-voice.js';
        console.log(JSON.stringify(tasks.map(t => ({
          id:t.id, target:t.target, text:rescuePrompt(t), prompt:rescueClip(t,'prompt'), word:rescueClip(t,'word')
        }))));
    """
    game = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', script], cwd=ROOT))
    authored = {row['id']: row for row in plan['tasks']}
    ids = set(range(1, 301))
    if len(game) != 300 or len(plan['tasks']) != 300 or {r['id'] for r in game} != ids or set(authored) != ids:
        raise ValueError('Expected 300 different, matching rescue IDs.')
    totals = {kind: sum(bool(r[kind]) for r in game) for kind in ('prompt', 'word')}
    print(f"Connected to the game: {totals['prompt']}/300 riddles, {totals['word']}/300 answers.", flush=True)
    recordings = {}
    for task in game:
        row = authored[task['id']]
        if task['target'] != row['target']:
            raise ValueError(f"Task {task['id']}: answer changed since the recording plan.")
        for kind in ('prompt', 'word'):
            path = task[kind]
            if not path:
                raise ValueError(f"Task {task['id']}: missing {kind} recording.")
            if kind == 'prompt' and row['prompt'] != task['text']:
                raise ValueError(f"Task {task['id']}: spoken and displayed riddles differ.")
            if kind == 'word' and row.get('reuseWord') and row['reuseWord'] != path:
                raise ValueError(f"Task {task['id']}: original word recording changed.")
            if path in recordings and recordings[path] != row[kind]:
                raise ValueError(f'Two different lines use {path}.')
            recordings[path] = row[kind]

    digests, published = {}, {}
    with ThreadPoolExecutor(max_workers=3) as pool:
        for name, expected, digest in pool.map(check_recording, recordings.items()):
            if digest in digests and digests[digest] != expected:
                raise ValueError(f'Reused audio for different lines at {name}.')
            digests[digest] = expected
            published[name] = digest
    if args.offline:
        verify_offline(args.offline, published)
    print(f'All {len(published)} recordings decoded and mapped to their assigned lines.')


if __name__ == '__main__':
    try:
        main()
    except ValueError as error:
        raise SystemExit(str(error))

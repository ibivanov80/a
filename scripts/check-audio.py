#!/usr/bin/env python3
"""Check every final Denis line against the authored script and decode its AAC."""
import concurrent.futures
import json
import hashlib
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[1]
plan=json.loads((ROOT/'denis-narration-plan.json').read_text())
manifest=json.loads((ROOT/'audio-manifest.json').read_text())
comedy=json.loads((ROOT/'comedy-narration-plan.json').read_text())
warmth=json.loads((ROOT/'warmth-narration-plan.json').read_text())
practice=json.loads((ROOT/'practice-narration-plan.json').read_text())
expected={r['file']:r for r in plan['files']+comedy['files']+warmth['files']+practice['files']}
actual={r['file']:r for r in manifest['files']}
assert len(actual)==manifest['count']==346 and actual.keys()==expected.keys()
assert manifest['provider']=='ElevenLabs' and manifest['voice_id']==plan['voice_id']=='0BcDz9UPwL3MpsnTeUlO'
assert manifest.get('model',manifest.get('model_id'))=='eleven_v4'
assert {p.name for p in (ROOT/'docs/audio').glob('*.m4a')}==expected.keys(),'Unexpected or missing published recordings'
def check(file):
    row=actual[file];wanted=expected[file];path=ROOT/'docs/audio'/file
    assert row['text']==wanted['text'],f'Stale text: {file}'
    assert row['performed_text']==wanted['performed_text'],f'Stale performance: {file}'
    assert hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256'],f'Changed file: {file}'
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
    stream=info['streams'][0];duration=float(info['format']['duration']);size=path.stat().st_size
    assert stream['codec_name']=='aac' and stream['sample_rate']=='44100' and stream['channels']==1,file
    assert size==row['bytes'] and abs(duration-row['duration'])<.035,file
    assert .3<duration<45 and size>1000,file
    r=subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(path),'-f','null','-'],capture_output=True,timeout=25)
    assert r.returncode==0,f'Decode failed: {file}'
    return duration,size
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(check,expected))
duration=sum(r[0] for r in results);size=sum(r[1] for r in results)
assert abs(duration-manifest['duration_seconds'])<.1
assert size==manifest['bytes']
print(f'Audio: {len(actual)} current Denis / ElevenLabs v4 clips decode, {duration/60:.1f} minutes, {size/1e6:.2f} MB.')

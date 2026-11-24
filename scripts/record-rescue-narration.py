#!/usr/bin/env python3
"""Build the static recordings. --record calls ElevenLabs; --plan and --assemble are offline."""
import argparse
import base64
import concurrent.futures
import fcntl
import hashlib
import json
import os
import re
from pathlib import Path
import shutil
import subprocess
import tempfile
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
MODEL = "eleven_v4"
FORMAT = "mp3_44100_128"


def atomic_write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
        temporary = Path(handle.name)
        try:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        except BaseException:
            temporary.unlink(missing_ok=True)
            raise
    temporary.replace(path)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load_plan():
    plan = json.loads((ROOT / "rescue-narration-plan.json").read_text())
    tasks = plan["tasks"]
    if (plan["language"] != "ru" or plan["voiceId"] != "0BcDz9UPwL3MpsnTeUlO" or
            [t["id"] for t in tasks] != list(range(1, 301))):
        raise ValueError("Wrong cast, language or mission order")
    for task in tasks:
        if not all(task.get(k, "").strip() for k in ("target", "prompt", "word")):
            raise ValueError(f"Incomplete mission {task['id']}")
        if "reuseWord" in task:
            actual = (DOCS / task["reuseWord"]).resolve()
            if not actual.is_relative_to(DOCS) or not actual.is_file():
                raise ValueError(f"Missing approved recording for {task['id']}")
    return plan


def requests_for(plan):
    jobs = []
    for task in plan["tasks"]:
        for kind in ("prompt", "word"):
            if kind == "word" and task.get("reuseWord"):
                continue
            context = task.get(kind + "Context")
            text = context or task[kind]
            crop_word = task[kind].strip(" .!?") if context else None
            if crop_word:
                find_answer_boundary(text, crop_word)
            payload = {"model_id": MODEL, "language_code": "ru", "text": text}
            body = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode()
            digest = sha(plan["voiceId"].encode() + b"/" + FORMAT.encode() + b"/" + body)
            name = f"r{task['id']:03}-{kind}-{digest[:12]}"
            jobs.append({"id": task["id"], "kind": kind, "name": name, "body": body, "crop_word": crop_word})
    return jobs


def valid_audio(path):
    if not path.is_file() or path.stat().st_size < 300:
        return False
    result = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-xerror", "-i", str(path),
                             "-map", "0:a:0", "-f", "null", "-"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return result.returncode == 0


def find_answer_boundary(text, word):
    spelling = "".join(re.escape(c) + ("\u0301?" if c.lower() in "аеёиоуыэюя" else "")
                       for c in word.replace("\u0301", ""))
    match = re.search(r"^" + spelling + r"(?!\w)", text, re.I)
    if not match:
        match = re.search(r"(?<!\w)" + spelling + r"(?=[.!?…\s]*$)", text, re.I)
    if not match:
        raise ValueError("Placement phrase must start or finish with the exact answer")
    return match


def final_word_times(response, word):
    aligned = response["alignment"]
    characters = aligned["characters"]
    text = "".join(characters)
    match = find_answer_boundary(text, word)
    if len(characters) != len(text):
        raise ValueError("Unexpected provider alignment")
    starts = aligned["character_start_times_seconds"]
    ends = aligned["character_end_times_seconds"]
    start = 0 if match.start() == 0 else max(0, starts[match.start()] - .045)
    end = ends[match.end()-1] + .10
    next_letter = next((i for i in range(match.end(), len(text)) if text[i].isalpha()), None)
    if next_letter is not None:
        end = min(end, starts[next_letter] - .008)
    if end <= start or end - start > 8:
        raise ValueError("Invalid word timestamps")
    return [start, end]


def encode(raw, path, times=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=path.parent) as d:
        encoded = Path(d) / "clip.m4a"
        subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
                        "-i", str(raw), "-vn", "-af",
                        (f"atrim=start={times[0]}:end={times[1]},asetpts=PTS-STARTPTS," if times else "")
                        + "loudnorm=I=-18:TP=-2:LRA=7",
                        "-ac", "1", "-ar", "44100", "-c:a", "aac", "-b:a", "80k",
                        "-movflags", "+faststart", str(encoded)], check=True)
        if not valid_audio(encoded):
            raise RuntimeError(f"Invalid encoded audio: {path.name}")
        encoded.replace(path)


def store_one(job, voice, cache, key):
    name = job["name"]
    raw = cache / (name + ".mp3")
    busy = cache / (name + ".submitted")
    final = DOCS / "assets/rescue-narration" / (name + ".m4a")
    if valid_audio(final):
        return
    timing_file = cache / (name + ".timing.json")
    if not raw.exists():
        if busy.exists():
            raise RuntimeError(f"{name}: check the previous submission in ElevenLabs history before resubmitting")
        suffix = "/with-timestamps" if job["crop_word"] else ""
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}{suffix}?output_format={FORMAT}"
        request = urllib.request.Request(url, data=job["body"], method="POST", headers={
            "Content-Type": "application/json", "Accept": "application/json" if job["crop_word"] else "audio/mpeg",
            "xi-api-key": key})
        atomic_write(busy, b"Awaiting audio response. Check provider history if interrupted.\n")
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                if job["crop_word"]:
                    result = json.load(response)
                    atomic_write(timing_file, json.dumps(final_word_times(result, job["crop_word"])).encode())
                    atomic_write(raw, base64.b64decode(result["audio_base64"], validate=True))
                else:
                    if not response.headers.get_content_type().startswith("audio/"):
                        raise RuntimeError(f"{name}: expected an audio response")
                    atomic_write(raw, response.read())
        except urllib.error.HTTPError as error:
            if error.code in (400, 401, 402, 403, 404, 422, 429):
                busy.unlink(missing_ok=True)
            try:
                detail = json.loads(error.read()).get("detail", {})
                status = detail.get("status", "") if isinstance(detail, dict) else ""
            except (ValueError, UnicodeError):
                status = ""
            raise RuntimeError(f"{name}: ElevenLabs HTTP {error.code} {status}") from None
    if not valid_audio(raw):
        raise RuntimeError(f"{name}: incomplete provider audio; check history before resubmitting")
    times = json.loads(timing_file.read_text()) if job["crop_word"] else None
    encode(raw, final, times)
    busy.unlink(missing_ok=True)
    print(f"Recorded {job['id']:03} {job['kind']}", flush=True)


def assemble(plan, jobs):
    recordings = {t["id"]: {"text": t["prompt"]} for t in plan["tasks"]}
    for t in plan["tasks"]:
        if t.get("reuseWord"):
            recordings[t["id"]]["word"] = t["reuseWord"]
    for job in jobs:
        relative = f"assets/rescue-narration/{job['name']}.m4a"
        if not (DOCS / relative).is_file():
            raise RuntimeError(f"Missing {relative}; keeping the current narration index")
        recordings[job["id"]][job["kind"]] = relative
    filenames = [entry[k] for entry in recordings.values() for k in ("prompt", "word")]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for name, valid in zip(filenames, pool.map(valid_audio, [DOCS / p for p in filenames])):
            if not valid:
                raise ValueError(f"Invalid recording: {name}")
    source = "// Generated from the approved voice script and verified audio files.\nexport const recordedRescues = "
    source += json.dumps(recordings, ensure_ascii=False, indent=2) + ";\n"
    atomic_write(DOCS / "rescue-narration.js", source.encode())
    print("Activated 300 riddles and 300 answers.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    actions = parser.add_mutually_exclusive_group(required=True)
    for name in ("plan", "record", "assemble"):
        actions.add_argument("--" + name, action="store_true")
    parser.add_argument("--cache", type=Path, default=Path(tempfile.gettempdir()) / "bukvobum-denis-sources")
    parser.add_argument("--limit", type=int, help="Record at most this many missing tracks")
    parser.add_argument("--only", type=int, help="Record one mission")
    parser.add_argument("--kind", choices=["prompt", "word"], help="Record only riddles or answers")
    parser.add_argument("--workers", type=int, choices=range(1, 5), default=2)
    args = parser.parse_args()
    plan = load_plan()
    jobs = requests_for(plan)
    needs_file = lambda j: not (DOCS / "assets/rescue-narration" / (j["name"] + ".m4a")).is_file()
    if args.plan:
        print(f"{len(jobs)} new tracks, {600-len(jobs)} existing tracks, {sum(map(needs_file, jobs))} missing.")
        return
    args.cache.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (args.cache / "build.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if args.record:
            key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
            if not key:
                raise SystemExit("Set ELEVENLABS_API_KEY locally to record the missing tracks.")
            if not shutil.which("ffmpeg"):
                raise SystemExit("Recording requires ffmpeg.")
            missing = [j for j in jobs if needs_file(j)
                       and (not args.only or j["id"] == args.only)
                       and (not args.kind or j["kind"] == args.kind)]
            if args.limit is not None:
                if args.limit < 1:
                    parser.error("--limit must be positive")
                missing = missing[:args.limit]
            # The first requested take doubles as the provider/voice check before a batch.
            if missing:
                store_one(missing[0], plan["voiceId"], args.cache, key)
            iterator = iter(missing[1:])
            with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
                def submit(j):
                    return pool.submit(store_one, j, plan["voiceId"], args.cache, key)
                pending = {submit(j) for _, j in zip(range(args.workers), iterator)}
                while pending:
                    completed, pending = concurrent.futures.wait(
                        pending, return_when=concurrent.futures.FIRST_COMPLETED)
                    for future in completed:
                        future.result()
                    for _, job in zip(completed, iterator):
                        pending.add(submit(job))
            if any(map(needs_file, jobs)):
                return
        assemble(plan, jobs)


if __name__ == "__main__":
    main()

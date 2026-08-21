"""Submit and download the fixed CASE 006 MiniMax H3 reference-to-video test."""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


HERE = Path(__file__).resolve().parent
REPO_ROOT = next(parent for parent in HERE.parents if (parent / ".git").exists())
IMAGE_PATH = REPO_ROOT / "docs/demos/h3-prompt-journal/assets/case-006-real-test/picture-1-lemon-sticker.png"
PROMPT_PATH = HERE / "prompt.txt"
RESULT_PATH = REPO_ROOT / "docs/demos/h3-prompt-journal/assets/case-006-real-test/result-video.mp4"
METADATA_PATH = HERE / "result-metadata.json"
CREATE_URL = "https://api.minimax.io/v2/video_generation"
QUERY_URL = "https://api.minimax.io/v2/query/video_generation/{task_id}"


def request_json(url: str, token: str, *, method: str = "GET", payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "0821-githubcode-study-h3-case-006/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"MiniMax API returned HTTP {error.code}: {detail}") from error


def build_payload() -> dict:
    image_bytes = IMAGE_PATH.read_bytes()
    image_url = "data:image/png;base64," + base64.b64encode(image_bytes).decode("ascii")
    return {
        "model": "MiniMax-H3",
        "content": [
            {"type": "text", "text": PROMPT_PATH.read_text(encoding="utf-8").strip()},
            {
                "type": "image_url",
                "image_url": {"url": image_url},
                "role": "reference_image",
            },
        ],
        "resolution": "768P",
        "duration": 10,
        "ratio": "16:9",
    }


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "0821-githubcode-study-h3-case-006/1.0"})
    with urllib.request.urlopen(request, timeout=180) as response:
        destination.write_bytes(response.read())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="validate inputs without creating a paid task")
    parser.add_argument("--poll-interval", type=int, default=15)
    parser.add_argument("--timeout-minutes", type=int, default=45)
    args = parser.parse_args()

    if not IMAGE_PATH.exists() or not PROMPT_PATH.exists():
        raise FileNotFoundError("CASE 006 image or prompt is missing")

    payload = build_payload()
    prompt = payload["content"][0]["text"]
    image_bytes = IMAGE_PATH.stat().st_size
    print(f"Validated CASE 006: prompt={len(prompt)} chars, image={image_bytes} bytes, 10s/768P/16:9")
    if args.dry_run:
        print("Dry run complete. No API request was sent and no credits were used.")
        return 0

    token = os.environ.get("MINIMAX_API_KEY", "").strip()
    if not token:
        print("MINIMAX_API_KEY is not set. Configure it locally; never commit or paste the key into chat.", file=sys.stderr)
        return 2

    created = request_json(CREATE_URL, token, method="POST", payload=payload)
    task_id = created.get("task_id")
    if not task_id:
        raise RuntimeError(f"Create response did not contain task_id: {created}")
    print(f"H3 task created: {task_id}")

    deadline = time.monotonic() + args.timeout_minutes * 60
    last_status = None
    while time.monotonic() < deadline:
        result = request_json(QUERY_URL.format(task_id=task_id), token)
        task = result.get("task", {})
        status = task.get("status", "unknown")
        if status != last_status:
            print(f"H3 task status: {status}")
            last_status = status
        if status == "succeeded":
            video_url = task.get("content", {}).get("url")
            if not video_url:
                raise RuntimeError("Succeeded task did not provide a video URL")
            RESULT_PATH.parent.mkdir(parents=True, exist_ok=True)
            download(video_url, RESULT_PATH)
            METADATA_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"Downloaded real H3 result: {RESULT_PATH}")
            print(f"Saved reproducibility metadata: {METADATA_PATH}")
            return 0
        if status in {"failed", "cancelled"}:
            METADATA_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            raise RuntimeError(f"H3 task ended with status {status}")
        time.sleep(max(5, args.poll_interval))

    raise TimeoutError(f"H3 task {task_id} did not finish within {args.timeout_minutes} minutes")


if __name__ == "__main__":
    raise SystemExit(main())

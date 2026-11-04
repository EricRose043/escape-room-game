"""Serve the local game without allowing stale browser module responses."""

from __future__ import annotations

import argparse
from functools import partial
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import sys


def directory_identity(directory: str | Path) -> str:
    """Identify the served folder without putting a Unicode path in headers."""
    canonical = os.path.normcase(str(Path(directory).resolve()))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:32]


class NoCacheGameHandler(SimpleHTTPRequestHandler):
    """Read each requested file again, including conditional browser requests."""

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".wasm": "application/wasm",
        ".svg": "image/svg+xml",
    }

    def __init__(self, *args, directory=None, **kwargs):
        self.game_root_identity = directory_identity(directory or Path.cwd())
        super().__init__(*args, directory=directory, **kwargs)

    def send_head(self):
        # SimpleHTTPRequestHandler normally compares whole-second mtimes and
        # can return 304 after two edits in the same second. Remove both browser
        # validators before that decision, for GET and HEAD alike. The standard
        # implementation still handles query strings, MIME types and file reads.
        for name in ("If-Modified-Since", "If-None-Match"):
            if name in self.headers:
                del self.headers[name]
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("X-Escape-Room-Server", "no-cache-v1")
        self.send_header("X-Escape-Room-Root", self.game_root_identity)
        super().end_headers()

    def log_message(self, _format, *args):
        # Local polling and module requests should not flood the game console.
        pass


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    root = Path(__file__).resolve().parent
    game = root if (root / "index.html").is_file() and (root / "src/game/main.js").is_file() else root / "escape-room-game"
    parser.add_argument(
        "--directory",
        type=Path,
        default=game,
        help="Game directory (defaults to this folder when it contains the game, otherwise its escape-room-game child).",
    )
    parser.add_argument("--port", type=int, default=8778, help="Loopback port (default: 8778).")
    args = parser.parse_args(argv)
    if not 0 <= args.port <= 65535:
        parser.error("--port must be between 0 and 65535")
    try:
        directory = args.directory.expanduser().resolve(strict=True)
    except (OSError, RuntimeError) as exc:
        parser.error(f"Cannot resolve game directory: {exc}")
    if not directory.is_dir():
        parser.error(f"Not a directory: {directory}")
    handler = partial(NoCacheGameHandler, directory=str(directory))
    try:
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    except OSError as exc:
        print(f"Cannot start game server: {exc}", file=sys.stderr)
        return 1
    with server:
        print(
            f"Escape Room no-cache-v1: http://127.0.0.1:{server.server_port}/index.html",
            flush=True,
        )
        try:
            server.serve_forever(poll_interval=0.25)
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

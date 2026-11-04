"""Serve the local game without allowing stale browser module responses."""

from __future__ import annotations

import argparse
from contextlib import contextmanager
from functools import partial
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import secrets
import sys
import threading

STATE_DIRECTORY = Path.home() / '.escape-room-game'


def control_state_path(port):
    return STATE_DIRECTORY / f'server-{int(port)}.json'


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

    def __init__(self, *args, directory=None, control_token=None, **kwargs):
        self.game_root_identity = directory_identity(directory or Path.cwd())
        self.control_token = control_token
        super().__init__(*args, directory=directory, **kwargs)

    def do_POST(self):
        if self.path != '/__escape-room__/shutdown' or not self.control_token:
            self.send_error(404)
            return
        supplied = self.headers.get('X-Escape-Room-Control-Token', '')
        # Only the local Python launcher has the per-server token. Browser
        # requests are rejected even if they somehow supply a matching header.
        if self.headers.get('Origin') is not None or not secrets.compare_digest(supplied.encode('utf-8'), self.control_token.encode('ascii')):
            self.send_error(403)
            return
        body = b'{"stopping":true}'
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        self.wfile.flush()
        threading.Thread(target=self.server.shutdown, daemon=True).start()

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
        if self.control_token:
            self.send_header('X-Escape-Room-Control', 'handover-v1')
        super().end_headers()

    def log_message(self, _format, *args):
        # Local polling and module requests should not flood the game console.
        pass


@contextmanager
def game_server(directory, port):
    directory = Path(directory).resolve()
    token = secrets.token_hex(32)
    handler = partial(NoCacheGameHandler, directory=str(directory), control_token=token)
    app = ThreadingHTTPServer(('127.0.0.1', port), handler)
    app.control_token = token
    state_path = control_state_path(app.server_port)
    state = {'app': 'escape-room-game', 'version': 1, 'pid': os.getpid(),
             'port': app.server_port, 'directory': str(directory), 'token': token}
    try:
        STATE_DIRECTORY.mkdir(mode=0o700, parents=True, exist_ok=True)
        temporary = state_path.with_name(state_path.name + '.' + token + '.tmp')
        with os.fdopen(os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'w', encoding='utf-8') as stream:
            json.dump(state, stream)
        temporary.replace(state_path)
    except OSError:
        # Gameplay remains available when a school profile disallows metadata.
        print('Automatic server handover metadata could not be saved.', file=sys.stderr)
    try:
        with app:
            yield app
    finally:
        try:
            if json.loads(state_path.read_text(encoding='utf-8')).get('token') == token:
                state_path.unlink()
        except (OSError, ValueError, AttributeError):
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
    try:
        with game_server(directory, args.port) as server:
            print(
                f"Escape Room no-cache-v1: http://127.0.0.1:{server.server_port}/index.html",
                flush=True,
            )
            try:
                server.serve_forever(poll_interval=0.1)
            except KeyboardInterrupt:
                pass
    except OSError as exc:
        print(f"Cannot start game server: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

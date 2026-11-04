"""Start the downloaded game locally, reusing its fixed save origin."""
from pathlib import Path
import re
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser
from prepare_escape_room_assets import prepare_assets
from serve_escape_room import directory_identity

ROOT = Path(__file__).resolve().parent
# GitHub source ZIPs put the game beside this script; the desktop distribution
# keeps it in a child folder. Require both entry files before preferring flat.
GAME = ROOT if (ROOT / "index.html").is_file() and (ROOT / "src/game/main.js").is_file() else ROOT / "escape-room-game"
PORT = 8778
URL = f"http://127.0.0.1:{PORT}/index.html"


def server_readiness_error(expected_version, *, directory=None, url=None):
    """Return why a server cannot be reused, or None for this exact release."""
    directory = GAME if directory is None else Path(directory)
    url = URL if url is None else url
    try:
        request = urllib.request.Request(url, headers={"Cache-Control": "no-cache", "Pragma": "no-cache"})
        with urllib.request.urlopen(request, timeout=2) as response:
            html = response.read().decode("utf-8")
            if response.headers.get("X-Escape-Room-Server") != "no-cache-v1":
                return "The running service is not the game's current no-cache server."
            served_root = response.headers.get("X-Escape-Room-Root")
            if not served_root:
                return "The running game server is older and cannot verify its folder."
            if served_root != directory_identity(directory):
                return "The running game server serves another extracted game folder."
            build = re.search(r'<meta\s+name=["\']escape-room-build["\']\s+content=["\']([^"\']+)["\']', html, re.IGNORECASE)
            actual_version = build.group(1) if build else "missing"
            if actual_version != expected_version:
                return f"The running game build is {actual_version}; this folder requires {expected_version}."
            if "棉花糖工坊：閉館之後" not in html or "./src/game/main.js" not in html:
                return "The server did not return the expected game page."
            return None
    except (OSError, ValueError):
        return "The game server is not responding with a valid page."


def game_is_ready(expected_version, *, directory=None, url=None):
    return server_readiness_error(expected_version, directory=directory, url=url) is None


def main():
    expected_version = prepare_assets(GAME)
    if not (GAME / "src/game/main.js").is_file():
        raise RuntimeError("Game files are missing: " + str(GAME))
    readiness_error = server_readiness_error(expected_version)
    if readiness_error:
        with socket.socket() as probe:
            probe.settimeout(1)
            if probe.connect_ex(("127.0.0.1", PORT)) == 0:
                raise RuntimeError(f"Port {PORT} is already occupied. {readiness_error} Close that server before retrying this folder's launcher; no process was stopped.")
        with (ROOT / "escape-room-server.log").open("ab") as log:
            server = subprocess.Popen(
                [sys.executable, str(ROOT / "serve_escape_room.py"), "--port", str(PORT), "--directory", str(GAME)],
                stdin=subprocess.DEVNULL,
                stdout=log,
                stderr=log,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
            )
        for _ in range(30):
            readiness_error = server_readiness_error(expected_version)
            if readiness_error is None:
                break
            if server.poll() is not None:
                raise RuntimeError("Server exited. See escape-room-server.log.")
            time.sleep(0.2)
        else:
            raise RuntimeError(f"Server did not become ready: {readiness_error} See escape-room-server.log.")
    print("Game ready: " + URL)
    if "--serve-only" not in sys.argv:
        webbrowser.open(URL, new=2)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("Unable to start game: " + str(error), file=sys.stderr)
        sys.exit(1)

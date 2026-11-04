"""Start the downloaded game locally, reusing its fixed save origin."""
from pathlib import Path
import ctypes
import hashlib
import json
import re
import socket
import subprocess
import sys
import time
import urllib.request
import webbrowser
from prepare_escape_room_assets import prepare_assets
from serve_escape_room import directory_identity, control_state_path

ROOT = Path(__file__).resolve().parent
# GitHub source ZIPs put the game beside this script; the desktop distribution
# keeps it in a child folder. Require both entry files before preferring flat.
GAME = ROOT if (ROOT / "index.html").is_file() and (ROOT / "src/game/main.js").is_file() else ROOT / "escape-room-game"
PORT = 8778
URL = f"http://127.0.0.1:{PORT}/index.html"
LEGACY_SERVER_SHA = '6213bd06978571bcb0d0f62a4a1d95aa6ed035f7'


def _git_sha(path):
    data = Path(path).read_bytes().replace(b'\r\n', b'\n')
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def trusted_legacy_command(args, executable, root_identity, port):
    """Recognize only our published Python file server, never an arbitrary PID."""
    try:
        if len(args) != 6 or args[2:5] != ['--port', str(port), '--directory']:
            return False
        script, directory = Path(args[1]).resolve(strict=True), Path(args[5]).resolve(strict=True)
        if script.name != 'serve_escape_room.py' or not re.fullmatch(r'python(?:w|\d+(?:\.\d+)*)?(?:\.exe)?', Path(executable).name, re.IGNORECASE):
            return False
        if Path(args[0]).resolve() != Path(executable).resolve() or directory_identity(directory) != root_identity:
            return False
        known = {LEGACY_SERVER_SHA, _git_sha(ROOT / 'serve_escape_room.py')}
        return _git_sha(script) in known and (directory / 'src/game/main.js').is_file()
    except (OSError, ValueError):
        return False


def _windows_listener(port):
    command = (
        '[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false); '
        f"$taskListener=Get-NetTCPConnection -State Listen -LocalPort {int(port)} -ErrorAction SilentlyContinue | Where-Object {{$_.LocalAddress -eq '127.0.0.1'}} | Select-Object -First 1; "
        'if($taskListener){$taskProcess=Get-CimInstance Win32_Process -Filter ("ProcessId="+$taskListener.OwningProcess); '
        '$taskProcess | Select-Object ProcessId,CommandLine,ExecutablePath,@{Name="Started";Expression={$_.CreationDate.ToUniversalTime().ToString("o")}} | ConvertTo-Json -Compress}'
    )
    result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', command],
                            capture_output=True, text=True, encoding='utf-8', timeout=12,
                            creationflags=subprocess.CREATE_NO_WINDOW)
    return json.loads(result.stdout) if result.returncode == 0 and result.stdout.strip() else None


def _stop_legacy_windows_server(root_identity, port):
    if sys.platform != 'win32':
        return False
    handle = None
    try:
        first = _windows_listener(port)
        if not first or not first.get('CommandLine') or not first.get('ExecutablePath'):
            return False
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel.OpenProcess.argtypes = [ctypes.c_ulong, ctypes.c_bool, ctypes.c_ulong]
        kernel.OpenProcess.restype = ctypes.c_void_p
        kernel.CloseHandle.argtypes = [ctypes.c_void_p]
        kernel.TerminateProcess.argtypes = [ctypes.c_void_p, ctypes.c_uint]
        kernel.QueryFullProcessImageNameW.argtypes = [ctypes.c_void_p, ctypes.c_ulong, ctypes.c_wchar_p, ctypes.POINTER(ctypes.c_ulong)]
        handle = kernel.OpenProcess(0x1000 | 0x0001, False, int(first['ProcessId']))
        if not handle:
            return False
        # Recheck after opening the handle, including creation time. A recycled
        # PID can never cause termination of a different process.
        if _windows_listener(port) != first:
            return False
        size = ctypes.c_ulong(32768)
        image = ctypes.create_unicode_buffer(size.value)
        if not kernel.QueryFullProcessImageNameW(handle, 0, image, ctypes.byref(size)) or Path(image.value).resolve() != Path(first['ExecutablePath']).resolve():
            return False
        shell = ctypes.WinDLL('shell32', use_last_error=True)
        shell.CommandLineToArgvW.argtypes = [ctypes.c_wchar_p, ctypes.POINTER(ctypes.c_int)]
        shell.CommandLineToArgvW.restype = ctypes.POINTER(ctypes.c_wchar_p)
        kernel.LocalFree.argtypes = [ctypes.c_void_p]
        count = ctypes.c_int()
        pointer = shell.CommandLineToArgvW(first['CommandLine'], ctypes.byref(count))
        if not pointer:
            return False
        try:
            args = [pointer[index] for index in range(count.value)]
        finally:
            kernel.LocalFree(ctypes.cast(pointer, ctypes.c_void_p))
        if not trusted_legacy_command(args, image.value, root_identity, port):
            return False
        return bool(kernel.TerminateProcess(handle, 0))
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError):
        return False
    finally:
        if handle:
            kernel.CloseHandle(handle)


def stop_previous_game_server(*, port=PORT):
    """Handover our own loopback server without touching other applications."""
    if not isinstance(port, int) or not 1 <= port <= 65535:
        return False
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/index.html', timeout=2) as response:
            html = response.read().decode('utf-8')
            if response.headers.get('X-Escape-Room-Server') != 'no-cache-v1' or '棉花糖工坊：閉館之後' not in html or './src/game/main.js' not in html:
                return False
            identity = response.headers.get('X-Escape-Room-Root')
            capability = response.headers.get('X-Escape-Room-Control')
        if not identity:
            return False
        if capability == 'handover-v1':
            state = json.loads(control_state_path(port).read_text(encoding='utf-8'))
            if state.get('app') != 'escape-room-game' or state.get('version') != 1 or state.get('port') != port or directory_identity(state['directory']) != identity or not re.fullmatch(r'[0-9a-f]{64}', state.get('token', '')):
                return False
            request = urllib.request.Request(f'http://127.0.0.1:{port}/__escape-room__/shutdown', data=b'', method='POST',
                                             headers={'X-Escape-Room-Control-Token': state['token']})
            with urllib.request.urlopen(request, timeout=3) as response:
                return response.status == 200 and json.loads(response.read()).get('stopping') is True
        return _stop_legacy_windows_server(identity, port)
    except (OSError, ValueError, KeyError, TypeError):
        return False


def port_is_open(port=PORT):
    with socket.socket() as probe:
        probe.settimeout(.3)
        return probe.connect_ex(('127.0.0.1', port)) == 0


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
            if response.headers.get('X-Escape-Room-Control') != 'handover-v1':
                return 'The old game server needs a one-time launcher upgrade.'
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
        if port_is_open(PORT):
            if not stop_previous_game_server(port=PORT):
                raise RuntimeError(f"8778仍由其他服務或無法驗證的舊服務占用，未停止任何其他程式。請先關閉原本的遊戲伺服器再重試。原因：{readiness_error}")
            print('已停止經確認的舊版遊戲服務，正在切換到這個資料夾。')
            deadline = time.monotonic() + 6
            while port_is_open(PORT) and time.monotonic() < deadline:
                time.sleep(.1)
            if port_is_open(PORT):
                raise RuntimeError('舊版遊戲服務尚未釋放8778，請稍後再啟動。')
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

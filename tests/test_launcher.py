"""Run with python -m unittest discover -s tests -p test_launcher.py."""
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest import mock
import urllib.error
import urllib.request

GAME_ROOT = Path(__file__).resolve().parents[1]
HELPERS = GAME_ROOT if (GAME_ROOT / 'play_escape_room.py').is_file() else GAME_ROOT.parent
sys.path.insert(0, str(HELPERS))
import play_escape_room as launcher
import serve_escape_room as server


class LauncherTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='escape-room-tests-')
        self.root = Path(self.temp.name).resolve()
        assert self.root.parent == Path(tempfile.gettempdir()).resolve() and self.root.name.startswith('escape-room-tests-')
        self.state_patch = mock.patch.object(server, 'STATE_DIRECTORY', self.root / 'private-state', create=True)
        self.state_patch.start()

    def tearDown(self):
        self.state_patch.stop()
        self.temp.cleanup()

    def game(self, name):
        root = self.root / name
        (root / 'src/game').mkdir(parents=True)
        (root / 'src/game/main.js').write_text('export const name=' + json.dumps(name) + ';', encoding='utf-8')
        (root / 'vendor/three').mkdir(parents=True)
        (root / 'vendor/three/three.module.js').write_text('export {};', encoding='utf-8')
        (root / 'assets').mkdir()
        (root / 'index.html').write_text('<meta charset="utf-8"><title>棉花糖工坊：閉館之後</title><script type="importmap">{}</script><script src="./src/game/main.js"></script>', encoding='utf-8')
        launcher.prepare_assets(root)
        return root

    @contextmanager
    def running(self, directory, port=0):
        with server.game_server(directory, port) as app:
            thread = threading.Thread(target=app.serve_forever, kwargs={'poll_interval': .02}, daemon=True)
            thread.start()
            try:
                yield app
            finally:
                if thread.is_alive():
                    app.shutdown()
                thread.join(3)

    def request_stop(self, app, token=None, origin=None):
        headers = {}
        if token is not None:
            headers['X-Escape-Room-Control-Token'] = token
        if origin is not None:
            headers['Origin'] = origin
        request = urllib.request.Request(f'http://127.0.0.1:{app.server_port}/__escape-room__/shutdown', data=b'', headers=headers, method='POST')
        return urllib.request.urlopen(request, timeout=3)

    def test_authenticated_handover_stops_only_the_previous_game(self):
        a, b = self.game('old'), self.game('new')
        with self.running(a) as old:
            port = old.server_port
            self.assertTrue(launcher.stop_previous_game_server(port=port))
            # Keep the fixed origin: after the old socket closes, B owns the same port.
        with self.running(b, port) as new:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/src/game/main.js') as response:
                self.assertIn(b'new', response.read())
            self.assertEqual(new.server_port, port)

    def test_control_rejects_missing_wrong_and_browser_origin_tokens(self):
        with self.running(self.game('protected')) as app:
            for token, origin in [(None, None), ('wrong', None), (app.control_token, 'https://example.invalid')]:
                with self.assertRaises(urllib.error.HTTPError) as failure:
                    self.request_stop(app, token, origin)
                self.assertEqual(failure.exception.code, 403)
            with urllib.request.urlopen(f'http://127.0.0.1:{app.server_port}/index.html') as response:
                self.assertEqual(response.status, 200)

    def test_stale_metadata_or_other_folder_is_not_used_to_stop_a_server(self):
        with self.running(self.game('real')) as app:
            path = server.control_state_path(app.server_port)
            state = json.loads(path.read_text(encoding='utf-8'))
            for field, value in [('token', '0' * 64), ('directory', str(self.game('other'))), ('port', app.server_port + 1)]:
                path.write_text(json.dumps({**state, field: value}), encoding='utf-8')
                self.assertFalse(launcher.stop_previous_game_server(port=app.server_port))
            path.write_text(json.dumps(state), encoding='utf-8')
            with urllib.request.urlopen(f'http://127.0.0.1:{app.server_port}/index.html') as response:
                self.assertEqual(response.status, 200)

    def test_unrelated_http_service_remains_running(self):
        root = self.game('unrelated')
        app = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
        thread = threading.Thread(target=app.serve_forever, kwargs={'poll_interval': .02}, daemon=True)
        thread.start()
        try:
            self.assertFalse(launcher.stop_previous_game_server(port=app.server_port))
            with urllib.request.urlopen(f'http://127.0.0.1:{app.server_port}/index.html') as response:
                self.assertEqual(response.status, 200)
        finally:
            app.shutdown(); thread.join(3); app.server_close()

    def test_state_is_private_and_removed_on_shutdown(self):
        with self.running(self.game('cleanup')) as app:
            path = server.control_state_path(app.server_port)
            state = json.loads(path.read_text(encoding='utf-8'))
            self.assertEqual(state['app'], 'escape-room-game')
            self.assertEqual(len(state['token']), 64)
            self.assertEqual(state['port'], app.server_port)
        self.assertFalse(path.exists())

    def test_launcher_refuses_an_unrelated_service_without_starting_or_opening_browser(self):
        root = self.game('unknown-service')
        app = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
        thread = threading.Thread(target=app.serve_forever, kwargs={'poll_interval': .02}, daemon=True)
        thread.start()
        try:
            with mock.patch.object(launcher, 'PORT', app.server_port), mock.patch.object(launcher, 'URL', f'http://127.0.0.1:{app.server_port}/index.html'), mock.patch.object(launcher, 'GAME', root), mock.patch.object(launcher.subprocess, 'Popen') as spawn, mock.patch.object(launcher.webbrowser, 'open') as browser:
                with self.assertRaisesRegex(RuntimeError, '未停止任何其他程式'):
                    launcher.main()
                spawn.assert_not_called(); browser.assert_not_called()
        finally:
            app.shutdown(); thread.join(3); app.server_close()

    def test_legacy_verification_rejects_different_script_port_and_directory(self):
        root = self.game('legacy')
        script = self.root / 'serve_escape_room.py'
        shutil.copyfile(GAME_ROOT / 'tests/fixtures/legacy-server/serve_escape_room.py', script)
        args = [sys.executable, str(script), '--port', '8778', '--directory', str(root)]
        identity = server.directory_identity(root)
        self.assertTrue(launcher.trusted_legacy_command(args, sys.executable, identity, 8778))
        self.assertFalse(launcher.trusted_legacy_command(args, sys.executable, identity, 8779))
        self.assertFalse(launcher.trusted_legacy_command(args, sys.executable, 'different-root', 8778))
        script.write_text('print("unrelated service")', encoding='utf-8')
        self.assertFalse(launcher.trusted_legacy_command(args, sys.executable, identity, 8778))

    @unittest.skipUnless(sys.platform == 'win32', 'legacy process identification uses Windows APIs')
    def test_published_legacy_server_can_be_replaced_on_windows(self):
        root = self.game('published-legacy')
        script = self.root / 'serve_escape_room.py'
        shutil.copyfile(GAME_ROOT / 'tests/fixtures/legacy-server/serve_escape_room.py', script)
        # Reserve a loopback port, then give it to the genuine published helper.
        import socket
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', 0)); port = probe.getsockname()[1]
        process = subprocess.Popen([sys.executable, str(script), '--port', str(port), '--directory', str(root)], stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=subprocess.CREATE_NO_WINDOW)
        try:
            self.assertIn(b'no-cache-v1', process.stdout.readline())
            self.assertTrue(launcher.stop_previous_game_server(port=port))
            process.wait(timeout=5)
        finally:
            if process.poll() is None:
                process.terminate(); process.wait(timeout=5)
            process.stdout.close(); process.stderr.close()


if __name__ == '__main__':
    unittest.main()

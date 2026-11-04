"""Give the complete browser module graph one content-derived release version."""
from pathlib import Path
import argparse
import hashlib
import json
import re


def prepare_assets(directory):
    game = Path(directory).resolve()
    page = game / 'index.html'
    if not page.is_file():
        raise RuntimeError('Game index.html is missing: ' + str(game))
    modules = sorted((game / 'src').rglob('*.js'))
    assets = sorted([*modules, *(game / 'src').rglob('*.css'), *(game / 'assets').rglob('*.png'), game / 'vendor/three/three.module.js'])
    digest = hashlib.sha256()
    for path in assets:
        digest.update(path.relative_to(game).as_posix().encode('utf-8'))
        digest.update(b'\0')
        digest.update(path.read_bytes())
        digest.update(b'\0')
    version = digest.hexdigest()[:16]
    imports = {'three': './vendor/three/three.module.js?v=' + version}
    for path in modules:
        key = './' + path.relative_to(game).as_posix()
        imports[key] = key + '?v=' + version
    manifest = '<script type="importmap">\n' + json.dumps({'imports': imports}, ensure_ascii=False, indent=2) + '\n    </script>'
    source = page.read_text(encoding='utf-8')
    updated, count = re.subn(r'<script type="importmap">[\s\S]*?</script>', lambda _: manifest, source, count=1)
    if count != 1:
        raise RuntimeError('Expected exactly one game import map')
    updated = re.sub(r'((?:src|href)=["\'])(\./src/[^"\'?]+\.(?:js|css))(?:\?[^"\']*)?(["\'])', lambda m: m[1] + m[2] + '?v=' + version + m[3], updated)
    updated = re.sub(r'\s*<meta name="escape-room-build" content="[^"]*">', '', updated)
    updated = updated.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n    <meta name="escape-room-build" content="' + version + '">', 1)
    if updated != source:
        page.write_bytes(updated.replace('\r\n', '\n').encode('utf-8'))
    return version


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    root = Path(__file__).resolve().parent
    game = root if (root / 'index.html').is_file() and (root / 'src/game/main.js').is_file() else root / 'escape-room-game'
    parser.add_argument('--directory', default=str(game))
    args = parser.parse_args()
    print('Game asset version: ' + prepare_assets(args.directory))

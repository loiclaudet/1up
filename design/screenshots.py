"""the readme's pictures, from the demo (`pnpm demo` first). the screenshots: chrome draws each at 2x, then each is cut
above the rail's footer (the part of the window nobody needs to see), its corners rounded and a hairline round it, so
it sits on github's light and dark pages alike: docs/screenshot.png (the hero) and the four below it. the pads' small
pictures for the readme's table: the rail's own drawings, lifted out of the page as svg files, in docs/pads.

run: python3 design/screenshots.py, with pillow installed; $CHROME names chrome when it isn't in /Applications"""

import os
import re
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
SCALE = 2
# the rail's footer is the window's last 80 px: each shot keeps the window's top `height - FOOTER - 12` px
FOOTER = 80
RADIUS = 14
LINE = (218, 219, 213, 255)  # --line, oklch(0.89 0.008 115)

# name, the demo's url, the window's height (1120 wide)
SHOTS = [
    ('screenshot', 'pads=snes,nes,famicom1,switch_pro&pad=1&driver=ready&press=a,right,r', 720),
    ('nes', 'pads=nes,snes,famicom1,switch_pro&pad=1&driver=ready&press=a,up', 800),
    ('famicom', 'pads=famicom1,famicom2,nes,snes&pad=1&driver=ready&press=b,right', 800),
    ('joycons', 'pads=joy_con_pair,switch_pro,snes,nes&pad=1&driver=ready&press=zl,x,up&right=21000,-21000', 800),
    ('editing', 'pads=nes,snes,famicom1,switch_pro&pad=1&driver=ready&select=a', 800),
]


def shoot(query, height, out):
    page = (ROOT / 'dist-demo/index.html').as_uri() + '?' + query
    subprocess.run(
        [CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--force-device-scale-factor={SCALE}',
         '--force-prefers-reduced-motion', f'--window-size=1120,{height}', '--virtual-time-budget=4000',
         f'--screenshot={out}', page],
        check=True, capture_output=True,
    )


def frame(src, dst, height):
    im = Image.open(src).convert('RGBA')
    im = im.crop((0, 0, im.width, height * SCALE))
    w, h = im.size
    # the corners, drawn 4x and brought down: smooth
    shape = Image.new('L', (w * 4, h * 4), 0)
    ImageDraw.Draw(shape).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), RADIUS * SCALE * 4, fill=255)
    ring = Image.new('L', (w * 4, h * 4), 0)
    ImageDraw.Draw(ring).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), RADIUS * SCALE * 4, outline=255, width=SCALE * 4)
    im = Image.composite(Image.new('RGBA', (w, h), LINE), im, ring.resize((w, h), Image.LANCZOS))
    im.putalpha(shape.resize((w, h), Image.LANCZOS))
    im.save(dst, optimize=True)
    print(dst.relative_to(ROOT), im.size)


# the rail's pictures, in the order the demo plugs these pads in, and the file each one goes to
PADS = [
    ('nes', 'nes'), ('famicom1', 'famicom1'), ('famicom2', 'famicom2'), ('snes', 'snes'), ('switch_pro', 'pro'),
    ('joy_con_pair', 'joycons'), ('n64', 'diagram'),
]
# what the page's stylesheet gives a picture at rest, the colours worked out (the pads' own are in their markup)
STYLE = (
    "text{font-family:Onest,'Segoe UI',system-ui,-apple-system,Helvetica,Arial,sans-serif}"
    '.pad-print{font-weight:700;font-size:9px;letter-spacing:.08em}'
    '.pad-print-mark{font-weight:800;font-size:12px}'
    '.pad-letter{font-weight:800;font-size:14px}'
    '.pad-face{font-weight:700;font-size:12.5px}'
    '.schematic-body{fill:#f1f2ed;stroke:#7f817a;stroke-width:1.5}'
    '.schematic .pad-control rect,.schematic .pad-control circle{fill:#fdfefc;stroke:#7f817a;stroke-width:1.5}'
    '.schematic .pad-control .cap{fill:#e7e8e2}'
    '.schematic .pad-control text{font-weight:700;font-size:11px;fill:#51544c;text-anchor:middle}'
)
# a soft shadow under each pad, like the rail's, and the room it needs
SHADOW = (
    '<filter id="shade" x="-20%" y="-20%" width="140%" height="150%">'
    '<feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#191c12" flood-opacity="0.18"/></filter>'
)
ROOM = 30
# each small picture's own height, in px: github shrinks a picture with no size of its own to nothing in a table
TALL = 48


def pictures():
    page = (ROOT / 'dist-demo/index.html').as_uri() + '?pads=' + ','.join(f for f, _ in PADS) + f'&pad={len(PADS)}'
    dom = subprocess.run(
        [CHROME, '--headless=new', '--disable-gpu', '--virtual-time-budget=4000', '--dump-dom', page],
        check=True, capture_output=True, text=True,
    ).stdout
    svgs = re.findall(r'<span class="thumb"[^>]*>(<svg.*?</svg>)</span>', dom, re.S)
    assert len(svgs) == len(PADS), f'{len(svgs)} pictures in the rail, {len(PADS)} pads'
    out = ROOT / 'docs/pads'
    out.mkdir(exist_ok=True)
    for (_, name), svg in zip(PADS, svgs):
        x, y, w, h = map(float, re.search(r'viewBox="([^"]+)"', svg).group(1).split())
        inner = svg[svg.index('>') + 1 : svg.rindex('</svg>')]
        # the rings only show a press: none at rest
        inner = re.sub(r'<(rect|circle|path|ellipse)[^>]*class="ring"[^>]*/?>(</\1>)?', '', inner)
        schematic = ' class="schematic"' if 'schematic' in svg[: svg.index('>')] else ''
        box = f'{x - ROOM} {y - ROOM} {w + 2 * ROOM} {h + 2 * ROOM}'
        wide = TALL * (w + 2 * ROOM) / (h + 2 * ROOM)
        (out / f'{name}.svg').write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{wide:.0f}" height="{TALL}" viewBox="{box}"{schematic}>'
            f'<defs><style>{STYLE}</style>{SHADOW}</defs><g filter="url(#shade)">{inner}</g></svg>\n'
        )
        print(f'docs/pads/{name}.svg')


def main():
    with tempfile.TemporaryDirectory() as tmp:
        for name, query, height in SHOTS:
            raw = Path(tmp) / f'{name}.png'
            shoot(query, height, raw)
            frame(raw, ROOT / f'docs/{name}.png', height - FOOTER - 12)
    pictures()


if __name__ == '__main__':
    main()

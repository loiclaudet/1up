"""the readme's download button: a window of four panes, the sign people look for to know a download is for windows,
and its label set in Onest, kerned by harfbuzz, as outlines so github draws it the same everywhere. writes
design/download.svg (an ink button, for light pages) and design/download-dark.svg (a paper one, for dark pages).

run: python3 design/button.py, with fonttools, brotli and uharfbuzz installed"""

import io

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

from logo import INK, PAPER, ROOT

ONEST = ROOT / 'node_modules/@fontsource-variable/onest/files/onest-latin-wght-normal.woff2'

HEIGHT = 72
RADIUS = 18
PAD = 30
ICON = 25
ICON_GAP = 16
# between the window's panes
PANE_GAP = 2.4
SIZE = 24
WEIGHT = 600


def label(text, size=SIZE, weight=WEIGHT):
    """`text`'s outlines at `size` px, its baseline at y = 0, kerned: (path, width, cap height)"""
    font = instancer.instantiateVariableFont(TTFont(ONEST), {'wght': weight})
    raw = io.BytesIO()
    font.flavor = None
    font.save(raw)
    face = hb.Face(raw.getvalue())
    shaper = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(shaper, buf, {'kern': True, 'liga': True})
    glyphs = font.getGlyphSet()
    order = font.getGlyphOrder()
    upem = font['head'].unitsPerEm
    scale = size / upem
    paths, x = [], 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        pen = SVGPathPen(glyphs)
        glyphs[order[info.codepoint]].draw(TransformPen(pen, (scale, 0, 0, -scale, (x + pos.x_offset) * scale, 0)))
        paths.append(pen.getCommands())
        x += pos.x_advance
    cap = font['OS/2'].sCapHeight * scale
    return ' '.join(p for p in paths if p), x * scale, cap


def panes(x, y):
    """the four panes, ICON square, from x, y"""
    side = (ICON - PANE_GAP) / 2
    return ''.join(
        f'M{x + dx:.2f} {y + dy:.2f}h{side:.2f}v{side:.2f}h{-side:.2f}Z'
        for dy in (0, side + PANE_GAP)
        for dx in (0, side + PANE_GAP)
    )


def button(text, fill, ink):
    words, width, cap = label(text)
    w = PAD + ICON + ICON_GAP + width + PAD
    baseline = HEIGHT / 2 + cap / 2
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.1f}" height="{HEIGHT}" viewBox="0 0 {w:.1f} {HEIGHT}"'
        f' role="img" aria-label="{text}">'
        f'<rect width="{w:.1f}" height="{HEIGHT}" rx="{RADIUS}" fill="{fill}"/>'
        f'<path d="{panes(PAD, (HEIGHT - ICON) / 2)}" fill="{ink}"/>'
        f'<path d="{words}" fill="{ink}" transform="translate({PAD + ICON + ICON_GAP} {baseline:.2f})"/>'
        '</svg>\n'
    )


def main():
    text = 'Download for Windows'
    (ROOT / 'design/download.svg').write_text(button(text, INK, PAPER))
    (ROOT / 'design/download-dark.svg').write_text(button(text, PAPER, INK))


if __name__ == '__main__':
    main()

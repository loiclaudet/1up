"""1up's logo: the mark, a d-pad with its up arm pressed and lit (one press up: 1up), and the wordmark, Darker
Grotesque at its heaviest, as outlines so it renders anywhere. writes design/logo.svg (for light backgrounds),
design/logo-dark.svg, design/mark.svg, and src/ui/logo-paths.ts (the same paths, for the app); `variants` writes the
three marks lodz chose from into design/variants.

run: python3 design/logo.py, with fonttools and brotli installed (the font is a woff2 in node_modules)"""

import math
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / 'node_modules/@fontsource-variable/darker-grotesque/files/darker-grotesque-latin-wght-normal.woff2'


def oklch(l, c, h):
    """an oklch colour as #rrggbb"""
    a, b = c * math.cos(math.radians(h)), c * math.sin(math.radians(h))
    l_, m_, s_ = l + 0.3963377774 * a + 0.2158037573 * b, l - 0.1055613458 * a - 0.0638541728 * b, l - 0.0894841775 * a - 1.2914855480 * b
    l3, m3, s3 = l_ ** 3, m_ ** 3, s_ ** 3
    rgb = (
        4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
        -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
        -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3,
    )
    gamma = lambda x: 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055
    return '#' + ''.join(f'{round(max(0, min(1, gamma(v))) * 255):02x}' for v in rgb)


INK = oklch(0.22, 0.014, 125)
PAPER = oklch(0.982, 0.004, 115)
LIVE = oklch(0.9, 0.19, 124)
GREY = oklch(0.6, 0.01, 118)

# the mark, 100 units square: a cross of arms 34 wide, its outer corners rounded
ARM = 31
RADIUS = 7.5
LO, HI = (100 - ARM) / 2, (100 + ARM) / 2
# the pressed arm sits a hair off the rest: the gap reads as a part that moves
GAP = 2.6


def rounded_arm(x0, y0, x1, y1, rounded):
    """a rectangle with the corners named in `rounded` ('tl', 'tr', 'br', 'bl') rounded"""
    r = lambda corner: RADIUS if corner in rounded else 0
    tl, tr, br, bl = r('tl'), r('tr'), r('br'), r('bl')
    return (
        f'M{x0 + tl:g} {y0:g}H{x1 - tr:g}' + (f'A{tr} {tr} 0 0 1 {x1:g} {y0 + tr:g}' if tr else '')
        + f'V{y1 - br:g}' + (f'A{br} {br} 0 0 1 {x1 - br:g} {y1:g}' if br else '')
        + f'H{x0 + bl:g}' + (f'A{bl} {bl} 0 0 1 {x0:g} {y1 - bl:g}' if bl else '')
        + f'V{y0 + tl:g}' + (f'A{tl} {tl} 0 0 1 {x0 + tl:g} {y0:g}' if tl else '') + 'Z'
    )


def triangle(cx, cy, size, pointing):
    """a small arrow head, pointing up, down, left or right"""
    h = size * 0.9
    points = {
        'up': [(cx, cy - h / 2), (cx - size / 2, cy + h / 2), (cx + size / 2, cy + h / 2)],
        'down': [(cx, cy + h / 2), (cx - size / 2, cy - h / 2), (cx + size / 2, cy - h / 2)],
        'left': [(cx - h / 2, cy), (cx + h / 2, cy - size / 2), (cx + h / 2, cy + size / 2)],
        'right': [(cx + h / 2, cy), (cx - h / 2, cy - size / 2), (cx - h / 2, cy + size / 2)],
    }[pointing]
    return 'M' + 'L'.join(f'{x:.2f} {y:.2f}' for x, y in points) + 'Z'


# the still arms and the middle as one shape, the lit up arm on its own and its arrow
REST = (
    rounded_arm(LO, HI - 0.01, HI, 100, {'bl', 'br'})
    + rounded_arm(0, LO, LO + 0.01, HI, {'tl', 'bl'})
    + rounded_arm(HI - 0.01, LO, 100, HI, {'tr', 'br'})
    + rounded_arm(LO, LO, HI, HI, set())
)
UP = rounded_arm(LO, 0, HI, LO - GAP, {'tl', 'tr'})
UP_ARROW = triangle(50, (LO - GAP) / 2 + 1, 12, 'up')
# the still arms' arrows, pressed into them: what makes the cross read as a d-pad
ARROWS = (
    triangle(50, HI + (100 - HI) / 2 - 1, 11, 'down')
    + triangle(LO / 2 + 1, 50, 11, 'left')
    + triangle(HI + (100 - HI) / 2 - 1, 50, 11, 'right')
)
DIMPLE = (50, 50, 5.5)


def spark(x0, y0, x1, y1, width=6.5):
    """a short stroke with round ends, as a filled path: a spark of the pop"""
    dx, dy = x1 - x0, y1 - y0
    length = math.hypot(dx, dy)
    nx, ny = -dy / length * width / 2, dx / length * width / 2
    r = width / 2
    return (
        f'M{x0 + nx:.2f} {y0 + ny:.2f}L{x1 + nx:.2f} {y1 + ny:.2f}A{r} {r} 0 0 0 {x1 - nx:.2f} {y1 - ny:.2f}'
        f'L{x0 - nx:.2f} {y0 - ny:.2f}A{r} {r} 0 0 0 {x0 + nx:.2f} {y0 + ny:.2f}Z'
    )


# the pop: three sparks over the lit arm, like a game's extra life popping up
POP = (
    spark(50, -10, 50, -22)
    + spark(LO - 7, -4, LO - 15, -12)
    + spark(HI + 7, -4, HI + 15, -12)
)


def halo(offset=6.5, width=3.2):
    """a ring around the lit arm, open where it meets the middle: the app's pressed ring"""
    x0, x1, y0, y1 = LO - offset, HI + offset, -offset, LO - GAP
    r = RADIUS + offset
    outer = (
        f'M{x0:.2f} {y1:.2f}V{y0 + r:.2f}A{r:.2f} {r:.2f} 0 0 1 {x0 + r:.2f} {y0:.2f}H{x1 - r:.2f}'
        f'A{r:.2f} {r:.2f} 0 0 1 {x1:.2f} {y0 + r:.2f}V{y1:.2f}'
    )
    return outer, width


def wordmark(text='1up', weight=900, height=100, tracking=-0.012):
    """the text's outlines, scaled so its tallest letter is `height` and its baseline at y = `height`"""
    font = TTFont(FONT)
    font = instancer.instantiateVariableFont(font, {'wght': weight})
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upem = font['head'].unitsPerEm
    names = [cmap[ord(ch)] for ch in text]
    # the tallest letter's top, in font units
    top = 0
    for name in names:
        bounds = BoundsPen(glyphs)
        glyphs[name].draw(bounds)
        if bounds.bounds:
            top = max(top, bounds.bounds[3])
    scale = height / top
    paths, x, left, right = [], 0.0, None, 0.0
    for name in names:
        pen = SVGPathPen(glyphs)
        # font units have y up: flip, and lay the baseline at `height`
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x * scale, height)))
        paths.append(pen.getCommands())
        bounds = BoundsPen(glyphs)
        glyphs[name].draw(bounds)
        if bounds.bounds:
            if left is None:
                left = bounds.bounds[0] * scale
            right = (x + bounds.bounds[2]) * scale
        x += glyphs[name].width + tracking * upem
    return ' '.join(paths), left or 0, right, scale


# in the lockup the mark stands a little taller than the letters, centred on them: heavy letters look bigger
MARK_SCALE = 1.12
MARK_TRANSFORM = f'translate({50 - 50 * MARK_SCALE:.2f} {50 - 50 * MARK_SCALE:.2f}) scale({MARK_SCALE})'


def svg(word, word_left, word_right, ink, still, lit, arrow_on_lit, style, gap=30, pad=6):
    """the lockup: the mark, then the wordmark, centred on the letters' height (the sparks rise above both)"""
    right_of_mark = 50 + 50 * MARK_SCALE
    shift = right_of_mark + gap - word_left
    width = shift + word_right + pad
    top = 32 if style == 'pop' else 16 if style == 'halo' else pad + 6
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad - 6} {-top} {width + pad + 6:.1f} {100 + top + 30}" role="img" aria-label="1up">'
        + f'<g transform="{MARK_TRANSFORM}">' + ''.join(mark_parts(still, lit, arrow_on_lit, style)) + '</g>'
        + f'<path d="{word}" fill="{ink}" transform="translate({shift:.2f} 0)"/></svg>\n'
    )


def mark_parts(still, lit, arrow_on_lit, style, engraved=GREY, dimple=None):
    """the mark's shapes for a style: `lit` (the arm alone), `pop` (sparks over it), `halo` (a ring around it)"""
    parts = [
        f'<path d="{REST}" fill="{still}"/>',
        f'<path d="{ARROWS}" fill="{engraved}"/>',
        f'<circle cx="{DIMPLE[0]}" cy="{DIMPLE[1]}" r="{DIMPLE[2]}" fill="{dimple or engraved}" opacity="0.55"/>',
        f'<path d="{UP}" fill="{lit}"/>',
        f'<path d="{UP_ARROW}" fill="{arrow_on_lit}"/>',
    ]
    if style == 'pop':
        parts.append(f'<path d="{POP}" fill="{lit}"/>')
    if style == 'halo':
        d, width = halo()
        parts.append(f'<path d="{d}" fill="none" stroke="{lit}" stroke-width="{width}" stroke-linecap="round"/>')
    return parts


def mark(still, lit, arrow_on_lit, style, background=None):
    tile = f'<rect x="-34" y="-40" width="168" height="168" rx="38" fill="{background}"/>' if background else ''
    box = '-34 -40 168 168' if background else '-6 -28 112 134'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" role="img" aria-label="1up">{tile}'
        + ''.join(mark_parts(still, lit, arrow_on_lit, style))
        + '</svg>\n'
    )


STYLE = 'pop'


def variants():
    """the three marks to choose from, each as a lockup on light and dark and as an icon"""
    word, left, right, _ = wordmark()
    out = ROOT / 'design/variants'
    out.mkdir(exist_ok=True)
    for style in ('lit', 'pop', 'halo'):
        (out / f'{style}.svg').write_text(svg(word, left, right, INK, INK, LIVE, INK, style))
        (out / f'{style}-dark.svg').write_text(svg(word, left, right, PAPER, PAPER, LIVE, INK, style))
        (out / f'{style}-icon.svg').write_text(mark(PAPER, LIVE, INK, style, background=INK))


def main():
    word, left, right, scale = wordmark()
    (ROOT / 'design/logo.svg').write_text(svg(word, left, right, INK, INK, LIVE, INK, STYLE))
    (ROOT / 'design/logo-dark.svg').write_text(svg(word, left, right, PAPER, PAPER, LIVE, INK, STYLE))
    (ROOT / 'design/mark.svg').write_text(mark(PAPER, LIVE, INK, STYLE, background=INK))
    shift = 50 + 50 * MARK_SCALE + 30 - left
    (ROOT / 'src/ui/logo-paths.ts').write_text(
        '// 1up\'s logo as paths, written by design/logo.py: the d-pad with its up arm lit, and the wordmark\n\n'
        f'export const REST = {REST!r};\n'
        f'export const ARROWS = {ARROWS!r};\n'
        f'export const DIMPLE = {list(DIMPLE)!r};\n'
        f'export const UP = {UP!r};\n'
        f'export const UP_ARROW = {UP_ARROW!r};\n'
        f'export const POP = {(POP if STYLE == "pop" else "")!r};\n'
        f'export const WORD = {word!r};\n'
        f'export const MARK_TRANSFORM = {MARK_TRANSFORM!r};\n'
        f'export const WORD_SHIFT = {shift:.2f};\n'
        f'export const WIDTH = {shift + right:.2f};\n'
    )
    print(f'ink {INK} paper {PAPER} live {LIVE} grey {GREY}; wordmark scale {scale:.4f}, {left:.1f}..{right:.1f}')


if __name__ == '__main__':
    import sys

    variants() if sys.argv[1:] == ['variants'] else main()

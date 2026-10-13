// the switch pro controller, drawn by 1up after the real one (no logo): two sticks (the left high, the right low),
// the d-pad, A B X Y, minus, plus, capture, home, and L R ZL ZR on its top edge. the sticks' caps follow the real
// sticks; pressing a stick is its own control

import { useId, type ReactNode } from 'react';
import type { Control } from '../types';
import { control, tilt, type PadArt, type PadPictureProps, type Part } from './props';

const BODY =
  'M100 50C150 40 250 40 300 50C338 57 362 78 372 116C382 156 388 218 372 258C360 288 318 292 304 266' +
  'C294 248 286 226 266 214C246 202 222 200 200 200C178 200 154 202 134 214C114 226 106 248 96 266' +
  'C82 292 40 288 28 258C12 218 18 156 28 116C38 78 62 57 100 50Z';

/// a band along the body's top left corner, which is close to an ellipse around (150, 150), 125 by 105: between
/// `inner` and `outer` times it, from angle `from` to `to` (degrees, clockwise from the right). L and ZL are two
/// such bands, ZL further out and behind; the right ones are mirrored
function band(inner: number, outer: number, from: number, to: number) {
  const at = (k: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(150 + 125 * k * Math.cos(a)).toFixed(1)} ${(150 + 105 * k * Math.sin(a)).toFixed(1)}`;
  };
  return (
    `M${at(inner, from)}L${at(outer, from)}A${(125 * outer).toFixed(1)} ${(105 * outer).toFixed(1)} 0 0 1 ${at(outer, to)}` +
    `L${at(inner, to)}A${(125 * inner).toFixed(1)} ${(105 * inner).toFixed(1)} 0 0 0 ${at(inner, from)}Z`
  );
}
const SHOULDER = band(0.98, 1.11, 194, 258);
const TRIGGER = band(1.06, 1.21, 202, 250);

function Pro(props: PadPictureProps) {
  const id = useId().replace(/:/g, '');
  const c = (k: Part) => control(k, props);
  const mirrored = 'translate(400 0) scale(-1 1)';
  const stick = (k: Control, s: Part, cx: number, cy: number, at: [number, number]) => {
    const [x, y] = tilt(at);
    return (
      <g {...c(s)}>
        <circle cx={cx} cy={cy} r="35" fill="#141518" />
        <circle cx={cx} cy={cy} r="35" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="35" fill="none" className="ring" />
        {/* pressing the stick lights its cap; a click anywhere on the stick edits both */}
        <g {...c(k)} onPointerDown={undefined} transform={`translate(${x * 9} ${y * 9})`}>
          <circle cx={cx} cy={cy + 2} r="26" fill="#0d0e10" />
          <circle cx={cx} cy={cy} r="26" fill={`url(#${id}cap)`} />
          <circle cx={cx} cy={cy} r="18.5" fill="none" stroke="#22242a" strokeWidth="3" />
          <circle cx={cx} cy={cy} r="26" fill="none" className="ring" />
        </g>
      </g>
    );
  };
  const face: [Control, number, number, string][] = [
    ['x', 290, 84, 'X'],
    ['a', 316, 110, 'A'],
    ['b', 290, 136, 'B'],
    ['y', 264, 110, 'Y'],
  ];
  const arms: [Control, string][] = [
    ['up', 'M147 150h22v24h-22z'],
    ['down', 'M147 190h22v24h-22z'],
    ['left', 'M124 171h24v22h-24z'],
    ['right', 'M168 171h24v22h-24z'],
  ];
  const small = (k: Control, shape: ReactNode, ring: ReactNode) => (
    <g {...c(k)}>
      {shape}
      {ring}
    </g>
  );
  return (
    <svg viewBox="0 0 400 300" className="pad-picture" role="img" aria-label="switch pro controller">
      <defs>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3c41" />
          <stop offset="0.6" stopColor="#26272b" />
          <stop offset="1" stopColor="#1c1d20" />
        </linearGradient>
        <radialGradient id={`${id}cap`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#54575e" />
          <stop offset="1" stopColor="#2a2c31" />
        </radialGradient>
        <radialGradient id={`${id}button`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#35373d" />
          <stop offset="1" stopColor="#131417" />
        </radialGradient>
        <linearGradient id={`${id}arm`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#35373c" />
          <stop offset="1" stopColor="#1a1b1e" />
        </linearGradient>
        <linearGradient id={`${id}shoulder`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#55575d" />
          <stop offset="1" stopColor="#2f3035" />
        </linearGradient>
      </defs>

      {/* ZL ZR, then L R, behind the body's top corners */}
      {/* the right ones mirrored in a group of their own: a held part's css transform must not undo it */}
      {(['zl', 'zr'] as const).map((k) => (
        <g key={k} transform={k === 'zr' ? mirrored : undefined}>
          <g {...c(k)}>
            <path d={TRIGGER} fill="#232428" stroke="#0e0e10" strokeWidth="1.5" strokeLinejoin="round" />
            <path d={TRIGGER} fill="none" className="ring" strokeLinejoin="round" />
          </g>
        </g>
      ))}
      {(['l', 'r'] as const).map((k) => (
        <g key={k} transform={k === 'r' ? mirrored : undefined}>
          <g {...c(k)}>
            <path d={SHOULDER} fill={`url(#${id}shoulder)`} stroke="#0e0e10" strokeWidth="1.5" strokeLinejoin="round" />
            <path d={SHOULDER} fill="none" className="ring" strokeLinejoin="round" />
          </g>
        </g>
      ))}

      {/* the body */}
      <path d={BODY} fill={`url(#${id}body)`} stroke="#0d0d0f" strokeWidth="2" />
      <ellipse cx="200" cy="64" rx="140" ry="12" fill="#fff" opacity="0.05" />

      {stick('lstick', 'stick:left', 120, 110, props.left)}

      {/* the d-pad in its well */}
      <circle cx="158" cy="182" r="36" fill="#141518" />
      <rect x="147" y="171" width="22" height="22" fill="#1d1e21" />
      {arms.map(([k, d]) => (
        <g key={k} {...c(k)}>
          <path d={d} fill={`url(#${id}arm)`} />
          <path d={d} fill="none" className="ring" />
        </g>
      ))}
      <path d="M158 156l-5 7h10z M158 208l-5-7h10z M130 182l7-5v10z M186 182l-7-5v10z" fill="#5e6168" pointerEvents="none" />

      {stick('rstick', 'stick:right', 262, 182, props.right)}

      {/* A B X Y */}
      {face.map(([k, x, y, letter]) => (
        <g key={k} {...c(k)}>
          <circle cx={x} cy={y + 1.5} r="14" fill="#0b0c0d" />
          <circle cx={x} cy={y} r="14" fill={`url(#${id}button)`} />
          <text x={x} y={y + 4.5} className="pad-face" fill="#e6e6e6" textAnchor="middle">
            {letter}
          </text>
          <circle cx={x} cy={y} r="14" fill="none" className="ring" />
        </g>
      ))}

      {/* minus, plus, capture, home */}
      {small(
        'minus',
        <>
          <circle cx="168" cy="80" r="9" fill={`url(#${id}button)`} />
          <rect x="163" y="78.75" width="10" height="2.5" rx="1" fill="#d8d8d8" />
        </>,
        <circle cx="168" cy="80" r="9" fill="none" className="ring" />,
      )}
      {small(
        'plus',
        <>
          <circle cx="232" cy="80" r="9" fill={`url(#${id}button)`} />
          <rect x="227" y="78.75" width="10" height="2.5" rx="1" fill="#d8d8d8" />
          <rect x="230.75" y="75" width="2.5" height="10" rx="1" fill="#d8d8d8" />
        </>,
        <circle cx="232" cy="80" r="9" fill="none" className="ring" />,
      )}
      {small(
        'capture',
        <>
          <rect x="171" y="109" width="16" height="16" rx="3" fill={`url(#${id}button)`} />
          <circle cx="179" cy="117" r="4" fill="none" stroke="#6f727a" strokeWidth="1.5" />
        </>,
        <rect x="171" y="109" width="16" height="16" rx="3" fill="none" className="ring" />,
      )}
      {small(
        'home',
        <>
          <circle cx="221" cy="117" r="9" fill={`url(#${id}button)`} />
          <circle cx="221" cy="117" r="9" fill="none" stroke="#9aa0a8" strokeWidth="1.5" />
          <path d="M216.5 118.5l4.5-4 4.5 4v3.5h-9z" fill="#c9cdd2" />
        </>,
        <circle cx="221" cy="117" r="9" fill="none" className="ring" />,
      )}
    </svg>
  );
}

export const PRO: PadArt = {
  w: 400,
  h: 300,
  Picture: Pro,
  anchors: {
    zl: [49, 65, 'top'],
    l: [86, 47, 'top'],
    minus: [168, 71, 'top'],
    capture: [171, 117],
    up: [158, 158],
    left: [131, 182],
    down: [158, 206],
    right: [185, 182],
    lstick: [120, 110],
    zr: [351, 65, 'top'],
    r: [314, 47, 'top'],
    plus: [232, 71, 'top'],
    home: [230, 117],
    x: [300, 74],
    y: [264, 96],
    a: [330, 110],
    b: [300, 146],
    rstick: [262, 182],
  },
  sticks: { left: [86, 110], right: [297, 182] },
  dpad: [158, 182],
};

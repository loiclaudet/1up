// two joy-cons held together, drawn by 1up after the real ones (no logo), in the neon blue and red they often come
// in: on the left, minus, its stick, the four direction buttons, capture, L and ZL; on the right, plus, X A B Y,
// its stick, home, R and ZR

import { useId } from 'react';
import type { Control } from '../types';
import { control, tilt, type PadArt, type PadPictureProps, type Part } from './props';

const LEFT = 'M186 22L130 22C94 22 72 48 72 84L72 216C72 252 94 278 130 278L186 278Z';
const RIGHT = 'M214 22L270 22C306 22 328 48 328 84L328 216C328 252 306 278 270 278L214 278Z';
const SHOULDER = 'M76 70C80 42 100 24 130 20L170 20L170 32L132 32C106 34 90 50 88 74Z';
const TRIGGER = 'M78 52C86 28 104 12 130 8L166 8L166 20L130 20C106 22 92 36 86 56Z';

function JoyCons(props: PadPictureProps) {
  const id = useId().replace(/:/g, '');
  const c = (k: Part) => control(k, props);
  const mirrored = 'translate(400 0) scale(-1 1)';
  const round = (k: Control, cx: number, cy: number, glyph: string) => (
    <g key={k} {...c(k)}>
      <circle cx={cx} cy={cy + 1.5} r="11" fill="#000" opacity="0.3" />
      <circle cx={cx} cy={cy} r="11" fill={`url(#${id}button)`} />
      <text x={cx} y={cy + 4} className="pad-face" fill="#e8e8e8" textAnchor="middle">
        {glyph}
      </text>
      <circle cx={cx} cy={cy} r="11" fill="none" className="ring" />
    </g>
  );
  const stick = (k: Control, s: Part, cx: number, cy: number, at: [number, number]) => {
    const [x, y] = tilt(at);
    return (
      <g {...c(s)}>
        <circle cx={cx} cy={cy} r="27" fill="#141518" opacity="0.92" />
        <circle cx={cx} cy={cy} r="27" fill="none" className="ring" />
        <g {...c(k)} onPointerDown={undefined} transform={`translate(${x * 7} ${y * 7})`}>
          <circle cx={cx} cy={cy + 2} r="20" fill="#0b0c0e" />
          <circle cx={cx} cy={cy} r="20" fill={`url(#${id}cap)`} />
          <circle cx={cx} cy={cy} r="14" fill="none" stroke="#22242a" strokeWidth="2.5" />
          <circle cx={cx} cy={cy} r="20" fill="none" className="ring" />
        </g>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 400 300" className="pad-picture" role="img" aria-label="two joy-cons">
      <defs>
        <linearGradient id={`${id}blue`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2fcbf2" />
          <stop offset="1" stopColor="#0897c2" />
        </linearGradient>
        <linearGradient id={`${id}red`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6a63" />
          <stop offset="1" stopColor="#d9403b" />
        </linearGradient>
        <radialGradient id={`${id}cap`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#54575e" />
          <stop offset="1" stopColor="#2a2c31" />
        </radialGradient>
        <radialGradient id={`${id}button`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#3a3c42" />
          <stop offset="1" stopColor="#15161a" />
        </radialGradient>
      </defs>

      {/* ZL ZR, then L R, on the outer top corners; the right ones mirrored in a group of their own */}
      {(
        [
          ['zl', TRIGGER, '#1f2024', false],
          ['zr', TRIGGER, '#1f2024', true],
          ['l', SHOULDER, '#34363b', false],
          ['r', SHOULDER, '#34363b', true],
        ] as const
      ).map(([k, d, fill, flip]) => (
        <g key={k} transform={flip ? mirrored : undefined}>
          <g {...c(k)}>
            <path d={d} fill={fill} stroke="#0e0e10" strokeWidth="1.5" strokeLinejoin="round" />
            <path d={d} fill="none" className="ring" strokeLinejoin="round" />
          </g>
        </g>
      ))}

      {/* the two joy-cons and their rails */}
      <path d={LEFT} fill={`url(#${id}blue)`} stroke="#05607d" strokeWidth="1.5" />
      <path d={RIGHT} fill={`url(#${id}red)`} stroke="#8e211e" strokeWidth="1.5" />
      <rect x="181" y="22" width="5" height="256" fill="#1b1c1f" />
      <rect x="214" y="22" width="5" height="256" fill="#1b1c1f" />

      {round('minus', 160, 46, '−')}
      {round('plus', 240, 46, '+')}
      {stick('lstick', 'stick:left', 126, 96, props.left)}
      {round('up', 126, 156, '▲')}
      {round('left', 102, 180, '◀')}
      {round('right', 150, 180, '▶')}
      {round('down', 126, 204, '▼')}
      {round('x', 274, 72, 'X')}
      {round('y', 250, 96, 'Y')}
      {round('a', 298, 96, 'A')}
      {round('b', 274, 120, 'B')}
      {stick('rstick', 'stick:right', 274, 184, props.right)}
      <g {...c('capture')}>
        <rect x="145" y="232" width="15" height="15" rx="3" fill={`url(#${id}button)`} />
        <rect x="145" y="232" width="15" height="15" rx="3" fill="none" className="ring" />
      </g>
      <g {...c('home')}>
        <circle cx="248" cy="240" r="9" fill={`url(#${id}button)`} />
        <circle cx="248" cy="240" r="9" fill="none" stroke="#9aa0a8" strokeWidth="1.5" />
        <circle cx="248" cy="240" r="9" fill="none" className="ring" />
      </g>
    </svg>
  );
}

export const JOYCONS: PadArt = {
  w: 400,
  h: 300,
  Picture: JoyCons,
  anchors: {
    zl: [96, 30, 'top'],
    l: [120, 26, 'top'],
    minus: [160, 35, 'top'],
    plus: [240, 35, 'top'],
    r: [280, 26, 'top'],
    zr: [304, 30, 'top'],
    up: [126, 145],
    left: [91, 180],
    down: [126, 215],
    right: [161, 180],
    capture: [152, 247, 'bottom'],
    home: [248, 249, 'bottom'],
    x: [285, 72],
    y: [250, 85],
    a: [309, 96],
    b: [285, 120],
  },
  sticks: { left: [99, 96], right: [301, 184] },
  dpad: [126, 180],
};

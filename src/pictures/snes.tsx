// the switch online snes pad, drawn by 1up after the real one (no logo): a grey body with round ends, the d-pad in
// its well, select and start slanted in the middle, X A B Y in their colours, L and R on the top edge and the ZL and
// ZR the switch online pad adds behind them

import { useId } from 'react';
import type { Control } from '../types';
import { control, type PadArt, type PadPictureProps } from './props';

/// two round ends joined by a waist
const BODY =
  'M100 30C126 30 146 40 160 50L260 50C274 40 294 30 320 30C368 30 406 66 406 112C406 158 368 194 320 194' +
  'C294 194 274 184 260 174L160 174C146 184 126 194 100 194C52 194 14 158 14 112C14 66 52 30 100 30Z';

const FACE: [Control, number, number, string, string, string][] = [
  ['x', 320, 72, 'X', '#4a6fcf', '#2c4a9a'],
  ['a', 360, 112, 'A', '#de3a3f', '#a11f25'],
  ['b', 320, 152, 'B', '#f3c62c', '#c2950d'],
  ['y', 280, 112, 'Y', '#2f9e5b', '#1c6f3d'],
];

function Snes(props: PadPictureProps) {
  const id = useId().replace(/:/g, '');
  const c = (k: Control) => control(k, props);
  const arms: [Control, string][] = [
    ['up', 'M88 72h24v28H88z'],
    ['down', 'M88 124h24v28H88z'],
    ['left', 'M60 100h28v24H60z'],
    ['right', 'M112 100h28v24h-28z'],
  ];
  return (
    <svg viewBox="0 0 420 210" className="pad-picture" role="img" aria-label="snes pad">
      <defs>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e1de" />
          <stop offset="1" stopColor="#c4c2be" />
        </linearGradient>
        <linearGradient id={`${id}arm`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4a4f" />
          <stop offset="1" stopColor="#24242a" />
        </linearGradient>
        <linearGradient id={`${id}pill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a7a80" />
          <stop offset="1" stopColor="#4c4c52" />
        </linearGradient>
        <linearGradient id={`${id}shoulder`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9c8c4" />
          <stop offset="1" stopColor="#a3a19c" />
        </linearGradient>
        {FACE.map(([k, , , , light, dark]) => (
          <radialGradient key={k} id={`${id}${k}`} cx="0.38" cy="0.32" r="0.8">
            <stop offset="0" stopColor={light} />
            <stop offset="1" stopColor={dark} />
          </radialGradient>
        ))}
      </defs>

      {/* ZL ZR behind, then L R, on the top edge */}
      {(
        [
          ['zl', 'M44 46C60 22 86 12 118 12L126 30C96 30 74 38 60 56Z'],
          ['zr', 'M376 46C360 22 334 12 302 12L294 30C324 30 346 38 360 56Z'],
        ] as const
      ).map(([k, d]) => (
        <g key={k} {...c(k)}>
          <path d={d} fill="#9c9a95" stroke="#7a7873" strokeWidth="1.5" strokeLinejoin="round" />
          <path d={d} fill="none" className="ring" />
        </g>
      ))}
      {(
        [
          ['l', 'M30 66C44 38 72 24 106 22L114 40C84 42 62 52 48 74Z'],
          ['r', 'M390 66C376 38 348 24 314 22L306 40C336 42 358 52 372 74Z'],
        ] as const
      ).map(([k, d]) => (
        <g key={k} {...c(k)}>
          <path d={d} fill={`url(#${id}shoulder)`} stroke="#86847f" strokeWidth="1.5" strokeLinejoin="round" />
          <path d={d} fill="none" className="ring" />
        </g>
      ))}

      {/* the body */}
      <path d={BODY} fill={`url(#${id}body)`} stroke="#8e8c87" strokeWidth="1.5" />
      <path d="M160 54L260 54" stroke="#f3f2ef" strokeWidth="2" opacity="0.7" />

      {/* the d-pad in its well */}
      <circle cx="100" cy="112" r="54" fill="#bdbbb6" />
      <circle cx="100" cy="112" r="52" fill="#b4b2ad" />
      <rect x="88" y="100" width="24" height="24" fill="#2a2a30" />
      {arms.map(([k, d]) => (
        <g key={k} {...c(k)}>
          <path d={d} fill={`url(#${id}arm)`} />
          <path d={d} fill="none" className="ring" />
        </g>
      ))}
      <path d="M100 78l-5 7h10z M100 146l-5-7h10z M66 112l7-5v10z M134 112l-7-5v10z" fill="#77777e" pointerEvents="none" />

      {/* select and start, slanted */}
      {(
        [
          ['minus', 190, 'SELECT'],
          ['plus', 232, 'START'],
        ] as const
      ).map(([k, x, label]) => (
        <g key={k}>
          <g {...c(k)} transform={`rotate(-28 ${x} 116)`}>
            <rect x={x - 16} y="109" width="32" height="13" rx="6.5" fill={`url(#${id}pill)`} />
            <rect x={x - 16} y="109" width="32" height="13" rx="6.5" fill="none" className="ring" />
          </g>
          <text x={x - 6} y="146" className="pad-print" fill="#8a8984" textAnchor="middle" transform={`rotate(-28 ${x - 6} 146)`}>
            {label}
          </text>
        </g>
      ))}

      {/* X A B Y in their well */}
      <circle cx="320" cy="112" r="60" fill="#c9c7c2" />
      <circle cx="320" cy="112" r="58" fill="#bebcb7" />
      {FACE.map(([k, x, y, letter]) => (
        <g key={k}>
          <g {...c(k)}>
            <circle cx={x} cy={y + 2} r="17" fill="#000" opacity="0.18" />
            <circle cx={x} cy={y} r="17" fill={`url(#${id}${k})`} />
            <circle cx={x} cy={y} r="17" fill="none" className="ring" />
          </g>
          {/* each letter printed beside its button, clear of the callouts' lines */}
          <text
            x={x + { x: -22, a: 18, b: -22, y: -16 }[k as 'x' | 'a' | 'b' | 'y']}
            y={y + { x: -14, a: 30, b: 28, y: -18 }[k as 'x' | 'a' | 'b' | 'y']}
            className="pad-letter"
            fill="#7d7b76"
            textAnchor="middle"
          >
            {letter}
          </text>
        </g>
      ))}
    </svg>
  );
}

export const SNES: PadArt = {
  w: 420,
  h: 210,
  Picture: Snes,
  anchors: {
    zl: [70, 30, 'top'],
    l: [86, 34, 'top'],
    r: [334, 34, 'top'],
    zr: [350, 30, 'top'],
    up: [100, 76],
    left: [64, 112],
    down: [100, 148],
    right: [136, 112],
    minus: [190, 122, 'bottom'],
    plus: [232, 122, 'bottom'],
    x: [336, 64],
    y: [266, 102],
    a: [377, 112],
    b: [336, 160],
  },
  dpad: [100, 112],
};

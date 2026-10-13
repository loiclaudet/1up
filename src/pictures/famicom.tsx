// the switch online famicom pads, drawn by 1up after the real ones (no logo): a red body and a gold face plate,
// the d-pad, B and A, the L and R shoulders on the top edge. the first pad has select and start; the second a
// volume slider and a microphone grille where they would be

import { useId } from 'react';
import type { Control } from '../types';
import { control, type PadArt, type PadPictureProps } from './props';

function Famicom({ second, ...props }: PadPictureProps & { second: boolean }) {
  const id = useId().replace(/:/g, '');
  const c = (k: Control) => control(k, props);
  const arms: [Control, string][] = [
    ['up', 'M88 62h24v26H88z'],
    ['down', 'M88 108h24v26H88z'],
    ['left', 'M62 86h26v24H62z'],
    ['right', 'M112 86h26v24h-26z'],
  ];
  return (
    <svg viewBox="0 0 400 186" className="pad-picture" role="img" aria-label={second ? 'famicom pad 2' : 'famicom pad 1'}>
      <defs>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4363d" />
          <stop offset="1" stopColor="#9b1a21" />
        </linearGradient>
        <linearGradient id={`${id}plate`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8d7a9" />
          <stop offset="0.5" stopColor="#d6c08b" />
          <stop offset="1" stopColor="#c0a66c" />
        </linearGradient>
        <pattern id={`${id}brushed`} width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="#fff" opacity="0.12" />
        </pattern>
        <radialGradient id={`${id}black`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#4a4241" />
          <stop offset="1" stopColor="#0f0c0c" />
        </radialGradient>
        <linearGradient id={`${id}arm`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3c3433" />
          <stop offset="1" stopColor="#141010" />
        </linearGradient>
        <linearGradient id={`${id}pill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8e2328" />
          <stop offset="1" stopColor="#5a1114" />
        </linearGradient>
        <linearGradient id={`${id}shoulder`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b5262d" />
          <stop offset="1" stopColor="#7d151a" />
        </linearGradient>
      </defs>

      {(
        [
          ['l', 44],
          ['r', 278],
        ] as const
      ).map(([k, x]) => (
        <g key={k} {...c(k)}>
          <rect x={x} y="8" width="78" height="24" rx="9" fill={`url(#${id}shoulder)`} stroke="#5e0f13" strokeWidth="1.5" />
          <rect x={x} y="8" width="78" height="24" rx="9" fill="none" className="ring" />
        </g>
      ))}

      {/* the body, the gold plate and its border line */}
      <rect x="8" y="20" width="384" height="158" rx="16" fill={`url(#${id}body)`} stroke="#68101a" strokeWidth="1.5" />
      <rect x="14" y="23" width="372" height="3" rx="1.5" fill="#ef7b80" opacity="0.45" />
      <rect x="26" y="36" width="348" height="126" rx="6" fill={`url(#${id}plate)`} />
      <rect x="26" y="36" width="348" height="126" rx="6" fill={`url(#${id}brushed)`} />
      <rect x="32" y="42" width="336" height="114" rx="3" fill="none" stroke="#8b7547" strokeWidth="1.25" />
      <rect x="346" y="48" width="16" height="16" rx="2" fill="none" stroke="#9b2a24" strokeWidth="1.5" />
      <text x="354" y="60.5" className="pad-print-mark" fill="#9b2a24" textAnchor="middle">
        {second ? 'II' : 'I'}
      </text>

      {/* the d-pad in its round well */}
      <circle cx="100" cy="98" r="40" fill="#2a2220" opacity="0.18" />
      <circle cx="100" cy="98" r="37" fill="#1b1514" />
      <rect x="88" y="86" width="24" height="24" fill="#1e1817" />
      {arms.map(([k, d]) => (
        <g key={k} {...c(k)}>
          <path d={d} fill={`url(#${id}arm)`} />
          <path d={d} fill="none" className="ring" />
        </g>
      ))}
      <path d="M100 68l-5 7h10z M100 128l-5-7h10z M70 98l7-5v10z M130 98l-7-5v10z" fill="#55494a" pointerEvents="none" />

      {second ? (
        <g pointerEvents="none">
          {/* the volume slider and the microphone grille */}
          <text x="200" y="58" className="pad-print" fill="#9b2a24" textAnchor="middle">
            VOLUME
          </text>
          <rect x="168" y="64" width="64" height="7" rx="3.5" fill="#6d5a36" />
          <rect x="190" y="60" width="12" height="15" rx="2.5" fill="#2e2418" />
          <rect x="176" y="88" width="48" height="40" rx="8" fill="#b79d63" stroke="#8b7547" strokeWidth="1.25" />
          {Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: 5 }, (_, col) => (
              <circle key={`${row}.${col}`} cx={184 + col * 8} cy={96 + row * 8} r="2" fill="#3a2e1d" />
            )),
          )}
          <text x="200" y="143" className="pad-print" fill="#9b2a24" textAnchor="middle">
            MIC
          </text>
        </g>
      ) : (
        <>
          <text x="176" y="98" className="pad-print" fill="#9b2a24" textAnchor="middle">
            SELECT
          </text>
          <text x="224" y="98" className="pad-print" fill="#9b2a24" textAnchor="middle">
            START
          </text>
          {(
            [
              ['minus', 160],
              ['plus', 208],
            ] as const
          ).map(([k, x]) => (
            <g key={k} {...c(k)}>
              <rect x={x} y="106" width="32" height="13" rx="6.5" fill={`url(#${id}pill)`} />
              <rect x={x} y="106" width="32" height="13" rx="6.5" fill="none" className="ring" />
            </g>
          ))}
        </>
      )}

      {/* B and A */}
      {(
        [
          ['b', 290, 'B'],
          ['a', 346, 'A'],
        ] as const
      ).map(([k, x, letter]) => (
        <g key={k}>
          <g {...c(k)}>
            <circle cx={x} cy="106" r="20" fill="#2a2220" opacity="0.25" />
            <circle cx={x} cy="104" r="18" fill={`url(#${id}black)`} />
            <circle cx={x} cy="104" r="18" fill="none" className="ring" />
          </g>
          <text x={x + 22} y="141" className="pad-letter" fill="#9b2a24" textAnchor="middle">
            {letter}
          </text>
        </g>
      ))}
    </svg>
  );
}

const ANCHORS: PadArt['anchors'] = {
  l: [83, 15, 'top'],
  r: [317, 15, 'top'],
  up: [100, 68],
  left: [70, 98],
  down: [100, 128],
  right: [130, 98],
  b: [290, 122, 'bottom'],
  a: [364, 104],
};

export const FAMICOM1: PadArt = {
  w: 400,
  h: 186,
  Picture: (props) => <Famicom second={false} {...props} />,
  anchors: { ...ANCHORS, minus: [176, 112, 'bottom'], plus: [224, 112, 'bottom'] },
  dpad: [100, 98],
};

export const FAMICOM2: PadArt = {
  w: 400,
  h: 186,
  Picture: (props) => <Famicom second {...props} />,
  anchors: ANCHORS,
  dpad: [100, 98],
};

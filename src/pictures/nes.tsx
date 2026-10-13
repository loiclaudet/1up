// the switch online nes pad, drawn by 1up after the real one (no logo): the nes pad's face, the d-pad, select and
// start in their recess, B and A in their beds, and the L and R shoulders on its top edge

import { useId } from 'react';
import type { Control } from '../types';
import { control, type PadArt, type PadPictureProps } from './props';

function Nes(props: PadPictureProps) {
  const id = useId().replace(/:/g, '');
  const c = (k: Control) => control(k, props);
  const arms: [Control, string][] = [
    ['up', 'M75 52h26v28H75z'],
    ['down', 'M75 112h26v28H75z'],
    ['left', 'M45 83h28v26H45z'],
    ['right', 'M103 83h28v26h-28z'],
  ];
  return (
    <svg viewBox="0 0 400 190" className="pad-picture" role="img" aria-label="nes pad">
      <defs>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4e1db" />
          <stop offset="1" stopColor="#c2beb6" />
        </linearGradient>
        <linearGradient id={`${id}plate`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2927" />
          <stop offset="1" stopColor="#1a1918" />
        </linearGradient>
        <radialGradient id={`${id}red`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#f0685a" />
          <stop offset="0.55" stopColor="#cd3428" />
          <stop offset="1" stopColor="#931e16" />
        </radialGradient>
        <linearGradient id={`${id}arm`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b3836" />
          <stop offset="1" stopColor="#141312" />
        </linearGradient>
        <linearGradient id={`${id}pill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#716c66" />
          <stop offset="1" stopColor="#3e3b37" />
        </linearGradient>
        <linearGradient id={`${id}shoulder`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bdb9b1" />
          <stop offset="1" stopColor="#9f9b93" />
        </linearGradient>
      </defs>

      {/* the shoulders, behind the body's top edge */}
      {(
        [
          ['l', 40],
          ['r', 278],
        ] as const
      ).map(([k, x]) => (
        <g key={k} {...c(k)}>
          <rect x={x} y="9" width="82" height="24" rx="9" fill={`url(#${id}shoulder)`} stroke="#86827a" strokeWidth="1.5" />
          <rect x={x} y="9" width="82" height="24" rx="9" fill="none" className="ring" />
        </g>
      ))}

      {/* the body and its face plate */}
      <rect x="6" y="22" width="388" height="160" rx="12" fill={`url(#${id}body)`} stroke="#8c887f" strokeWidth="1.5" />
      <rect x="10" y="24.5" width="380" height="2.5" rx="1.25" fill="#f6f4f0" opacity="0.75" />
      <rect x="20" y="40" width="360" height="128" rx="7" fill={`url(#${id}plate)`} />
      <rect x="22" y="41" width="356" height="1.5" rx="0.75" fill="#4b4744" />

      {/* the d-pad: its middle, then each arm */}
      <rect x="71" y="79" width="34" height="34" rx="3" fill="#0c0b0b" />
      <rect x="75" y="83" width="26" height="26" fill="#1b1a19" />
      <circle cx="88" cy="96" r="5" fill="#0e0d0d" stroke="#2d2a28" strokeWidth="1" />
      {arms.map(([k, d]) => (
        <g key={k} {...c(k)}>
          <path d={d} fill={`url(#${id}arm)`} />
          <path d={d} fill="none" className="ring" />
        </g>
      ))}
      <path d="M88 60l-5 7h10z M88 132l-5-7h10z M53 96l7-5v10z M123 96l-7-5v10z" fill="#4e4a47" pointerEvents="none" />

      {/* the stripes, select and start */}
      {[54, 64, 74].map((y) => (
        <rect key={y} x="152" y={y} width="96" height="5" rx="2.5" fill="#8d8982" />
      ))}
      <text x="173" y="103" className="pad-print" fill="#cf463a" textAnchor="middle">
        SELECT
      </text>
      <text x="227" y="103" className="pad-print" fill="#cf463a" textAnchor="middle">
        START
      </text>
      <rect x="146" y="110" width="108" height="30" rx="15" fill="#8d8982" />
      <rect x="148" y="112" width="104" height="26" rx="13" fill="#9c9891" />
      {(
        [
          ['minus', 156],
          ['plus', 210],
        ] as const
      ).map(([k, x]) => (
        <g key={k} {...c(k)}>
          <rect x={x} y="118" width="34" height="14" rx="7" fill={`url(#${id}pill)`} />
          <rect x={x} y="118" width="34" height="14" rx="7" fill="none" className="ring" />
        </g>
      ))}

      {/* B and A in their beds */}
      {(
        [
          ['b', 290, 'B'],
          ['a', 350, 'A'],
        ] as const
      ).map(([k, x, letter]) => (
        <g key={k}>
          <rect x={x - 27} y="69" width="54" height="54" rx="7" fill="#dbd8d1" />
          <rect x={x - 25} y="69.5" width="50" height="2" rx="1" fill="#f6f4f0" opacity="0.85" />
          <g {...c(k)}>
            <circle cx={x} cy="97" r="19" fill="#6a140e" />
            <circle cx={x} cy="95.5" r="18" fill={`url(#${id}red)`} />
            <circle cx={x} cy="95.5" r="18" fill="none" className="ring" />
          </g>
          <text x={x + 21} y="146" className="pad-letter" fill="#cf463a" textAnchor="middle">
            {letter}
          </text>
        </g>
      ))}
    </svg>
  );
}

export const NES: PadArt = {
  w: 400,
  h: 190,
  Picture: Nes,
  anchors: {
    l: [81, 14, 'top'],
    r: [319, 14, 'top'],
    up: [88, 60],
    left: [52, 96],
    down: [88, 132],
    right: [124, 96],
    minus: [173, 125, 'bottom'],
    plus: [227, 125, 'bottom'],
    b: [290, 114, 'bottom'],
    a: [368, 96],
  },
  dpad: [88, 96],
};

// a nintendo pad with no picture of its own yet (the snes, n64 and genesis pads, the joy-cons): a quiet line drawing
// with each of its controls where a pad usually has it, named as nintendo prints them

import type { Control, Stick } from '../types';
import { control, tilt, type PadArt, type PadPictureProps, type Part } from './props';

const BODY =
  'M96 58C150 46 250 46 304 58C346 66 368 96 376 140C384 186 382 226 356 240C332 252 304 240 290 218' +
  'C276 196 250 188 200 188C150 188 124 196 110 218C96 240 68 252 44 240C18 226 16 186 24 140C32 96 54 66 96 58Z';

const PLACES: Partial<Record<Control, [number, number, string]>> = {
  zl: [92, 36, 'ZL'],
  l: [128, 44, 'L'],
  r: [272, 44, 'R'],
  zr: [308, 36, 'ZR'],
  up: [104, 106, ''],
  down: [104, 150, ''],
  left: [82, 128, ''],
  right: [126, 128, ''],
  minus: [170, 98, '−'],
  plus: [230, 98, '+'],
  capture: [180, 132, ''],
  home: [220, 132, ''],
  x: [296, 100, 'X'],
  a: [320, 124, 'A'],
  b: [296, 148, 'B'],
  y: [272, 124, 'Y'],
};
const STICKS: Record<Stick, [number, number]> = { left: [150, 190], right: [250, 190] };

function Schematic(props: PadPictureProps) {
  const has = new Set(props.controls ?? Object.keys(PLACES));
  const sticks = props.sticks ?? [];
  const c = (k: Part) => control(k, props);
  const shape = (k: Control, [x, y, label]: [number, number, string]) => {
    if (['up', 'down', 'left', 'right'].includes(k)) {
      const vertical = k === 'up' || k === 'down';
      return <rect x={x - (vertical ? 10 : 12)} y={y - (vertical ? 12 : 10)} width={vertical ? 20 : 24} height={vertical ? 24 : 20} rx="3" />;
    }
    if (k === 'l' || k === 'r' || k === 'zl' || k === 'zr')
      return (
        <>
          <rect x={x - 22} y={y - 9} width="44" height="18" rx="9" />
          <text x={x} y={y + 4}>{label}</text>
        </>
      );
    if (k === 'capture') return <rect x={x - 7} y={y - 7} width="14" height="14" rx="3" />;
    return (
      <>
        <circle cx={x} cy={y} r={label.length ? 12 : 8} />
        {label && <text x={x} y={y + 4}>{label}</text>}
      </>
    );
  };
  return (
    <svg viewBox="0 0 400 260" className="pad-picture schematic" role="img" aria-label="pad">
      {(Object.entries(PLACES) as [Control, [number, number, string]][])
        .filter(([k]) => ['zl', 'zr', 'l', 'r'].includes(k) && has.has(k))
        .map(([k, place]) => (
          <g key={k} {...c(k)}>
            {shape(k, place)}
          </g>
        ))}
      <path d={BODY} className="schematic-body" />
      {sticks.map((s) => {
        const [x, y] = STICKS[s];
        const [dx, dy] = tilt(s === 'left' ? props.left : props.right);
        return (
          <g key={s} {...c(`stick:${s}`)}>
            <circle cx={x} cy={y} r="24" />
            <circle cx={x + dx * 7} cy={y + dy * 7} r="15" className="cap" />
          </g>
        );
      })}
      {(Object.entries(PLACES) as [Control, [number, number, string]][])
        .filter(([k]) => !['zl', 'zr', 'l', 'r'].includes(k) && has.has(k))
        .map(([k, place]) => (
          <g key={k} {...c(k)}>
            {shape(k, place)}
          </g>
        ))}
    </svg>
  );
}

export const SCHEMATIC: PadArt = {
  w: 400,
  h: 260,
  Picture: Schematic,
  anchors: Object.fromEntries(
    (Object.entries(PLACES) as [Control, [number, number, string]][]).map(([k, [x, y]]) => [
      k,
      ['zl', 'l', 'r', 'zr'].includes(k) ? [x, y, 'top'] : [x, y],
    ]),
  ),
  sticks: { left: [126, 190], right: [274, 190] },
  dpad: [104, 128],
};

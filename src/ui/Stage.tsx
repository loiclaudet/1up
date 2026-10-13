// the stage: the pad drawn big on a soft floor, and around it a callout for each part, a thin leader line from the
// part to a label saying what it sends. the shoulders' labels sit above the pad, the middle buttons' below, the rest
// in a column on their side. the d-pad is one callout while its arms go to one place; a stick's callout says its
// press too. a press lights the part and its callout; a click on either edits it, and while one is edited only its
// callout stays, the pad drawn bigger

import { useRef } from 'react';
import { artOf, type PadArt, type Part } from '../pictures';
import type { Side } from '../pictures/props';
import { controlName, keyName, stickKeysName, stickName, stickTargetName, targetName } from '../labels';
import { SCAN } from '../profile';
import type { Control, PadView, Stick } from '../types';
import { column, row, type Anchor } from './callouts';
import { useSize } from './useSize';

const MIN_COLUMN = 100;
const GAP = 40;
/// a callout: its part's name on a line of 14 px, 2 px, then its chip, 26 px tall
const FROM = 14;
const CHIP = 26;
const CALLOUT = FROM + 2 + CHIP;
const STEP = CALLOUT + 8;
const ROW_SPACE = CALLOUT + 26;
const PUSHED = 16384;
const ARMS = ['up', 'down', 'left', 'right'] as const;

export const stickOf = (part: Part): Stick | null => (part.startsWith('stick:') ? (part.slice(6) as Stick) : null);

/// where the d-pad's four arms go, when they go to one place: its name; undefined when they part ways
export function dpadAsOne(pad: PadView): string | null | undefined {
  if (!ARMS.every((a) => pad.controls.includes(a))) return undefined;
  const p = pad.profile;
  if (p.output === 'off') return null;
  if (p.output === 'xbox') {
    const to = ARMS.map((a) => p.xbox[a]);
    if (to.every((t) => t === undefined)) return null;
    for (const [prefix, name] of [['', 'D-pad'], ['lstick-', 'Left stick'], ['rstick-', 'Right stick']] as const)
      if (ARMS.every((a, i) => to[i] === `${prefix}${a}`)) return name;
    return undefined;
  }
  const keys = ARMS.map((a) => p.keys[a]);
  if (keys.every((k) => k === undefined)) return null;
  if (keys.join() === [SCAN.up, SCAN.down, SCAN.left, SCAN.right].join()) return 'Arrow keys';
  if (keys.join() === [0x11, 0x1f, 0x1e, 0x20].join()) return 'W A S D';
  return undefined;
}

/// what a part sends now, in words; null for nothing
export function sends(pad: PadView, part: Part): string | null {
  const p = pad.profile;
  if (p.output === 'off') return null;
  if (part === 'dpad') return dpadAsOne(pad) ?? null;
  const stick = stickOf(part);
  if (p.output === 'xbox') {
    if (stick) return p.xbox_sticks[stick] ? stickTargetName(p.xbox_sticks[stick]!) : null;
    const to = p.xbox[part as Control];
    return to ? targetName(to) : null;
  }
  if (stick) return p.key_sticks[stick] ? stickKeysName(p.key_sticks[stick]!) : null;
  const key = p.keys[part as Control];
  return key === undefined ? null : keyName(key);
}

export function partName(pad: PadView, part: Part): string {
  if (part === 'dpad') return 'D-pad';
  const stick = stickOf(part);
  return stick ? stickName(stick) : controlName(part as Control, pad.family);
}

/// a part held now: a control down, the d-pad's arms, a stick past half way or pressed
export function lit(pad: PadView, part: Part): boolean {
  if (part === 'dpad') return ARMS.some((a) => pad.held.controls.includes(a));
  const stick = stickOf(part);
  if (!stick) return pad.held.controls.includes(part as Control);
  const [x, y] = stick === 'left' ? pad.held.left : pad.held.right;
  const press: Control = stick === 'left' ? 'lstick' : 'rstick';
  return Math.abs(x) > PUSHED || Math.abs(y) > PUSHED || pad.held.controls.includes(press);
}

interface Callout {
  part: Part;
  x: number;
  y: number;
  side: Side;
}

/// the parts with a callout, where they sit on the art (in its units) and on which side their label goes
function parts(pad: PadView, art: PadArt, selected: Part | null): Callout[] {
  const out: Callout[] = [];
  const add = (part: Part, at: [number, number, Side?] | undefined) => {
    if (at) out.push({ part, x: at[0], y: at[1], side: at[2] ?? (at[0] < art.w / 2 ? 'left' : 'right') });
  };
  const asOne = art.dpad && dpadAsOne(pad) !== undefined && !ARMS.some((a) => a === selected);
  if (asOne) add('dpad', art.dpad);
  for (const c of pad.controls) {
    if (asOne && (ARMS as readonly string[]).includes(c)) continue;
    // a stick's press is said in its stick's callout
    if ((c === 'lstick' && pad.sticks.includes('left')) || (c === 'rstick' && pad.sticks.includes('right'))) continue;
    add(c, art.anchors[c]);
  }
  for (const s of pad.sticks) add(`stick:${s}`, art.sticks?.[s]);
  return out;
}

/// a stick's press, when it is not its own stick's press (LS for the left one): said after the stick's target
export function pressNote(pad: PadView, part: Part): string | null {
  const stick = stickOf(part);
  if (!stick || pad.profile.output === 'off') return null;
  const press: Control = stick === 'left' ? 'lstick' : 'rstick';
  const p = pad.profile;
  if (p.output === 'xbox') {
    const to = p.xbox[press];
    if (to === (stick === 'left' ? 'ls' : 'rs')) return null;
    return to ? `press ${targetName(to)}` : 'press does nothing';
  }
  const key = p.keys[press];
  return key === undefined ? null : `press ${keyName(key)}`;
}

/// a label's width, roughly: the wider of its name (11.5 px) and its chip (13 px, padded) with the press note
const labelWidth = (pad: PadView, part: Part) =>
  Math.max(
    partName(pad, part).length * 6.6,
    (sends(pad, part) ?? 'nothing').length * 8.2 + 26 + (pressNote(pad, part)?.length ?? -1) * 6.8 + 6,
  ) + 16;

export function Stage({
  pad,
  selected,
  onSelect,
  onHold,
}: {
  pad: PadView;
  selected: Part | null;
  onSelect: (part: Part) => void;
  /// the demo's presses: a control held while the pointer is down on it
  onHold?: (c: Control, down: boolean) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(box);
  const art = artOf(pad.family);
  const held = new Set(pad.held.controls);
  const focus = selected !== null;

  const all = parts(pad, art, selected);
  const shown = focus ? all.filter((c) => c.part === selected) : all;
  const hasTop = shown.some((c) => c.side === 'top');
  const hasBottom = shown.some((c) => c.side === 'bottom');
  // each column as wide as its widest label: the pad centred between equal margins, or while one part is edited,
  // between its label's side and the stage's other edge, so it grows
  const widest = (side: Side) => {
    const on = shown.filter((c) => c.side === side);
    return on.length ? Math.max(MIN_COLUMN, ...on.map((c) => labelWidth(pad, c.part))) + GAP : 24;
  };
  const both = Math.max(widest('left'), widest('right'));
  const [left, right] = focus ? [widest('left'), widest('right')] : [both, both];
  const spaceTop = hasTop ? ROW_SPACE : 24;
  const spaceBottom = hasBottom ? ROW_SPACE : 24;
  const scale = Math.max(0.1, Math.min((w - left - right - 16) / art.w, (h - spaceTop - spaceBottom - 24) / art.h, 2.1));
  const pw = art.w * scale;
  const ph = art.h * scale;
  const px = left + (w - left - right - pw) / 2;
  const py = spaceTop + (h - spaceTop - spaceBottom - ph) / 2;

  const on = (c: Callout): Anchor & { side: Side } => ({
    id: c.part,
    x: px + c.x * scale,
    y: py + c.y * scale,
    side: c.side,
    width: labelWidth(pad, c.part),
  });
  const placed = shown.map(on);
  const sideOf = (s: Side) => placed.filter((a) => a.side === s);
  // the rows' callouts: above the pad, their chips 14 px over it; below, their names 14 px under it
  const topY = py - 14 - CALLOUT;
  const bottomY = py + ph + 14;
  const layout = w
    ? [
        ...column(sideOf('left'), 24, h - 24, STEP).map((p) => ({ ...p, side: 'left' as Side })),
        ...column(sideOf('right'), 24, h - 24, STEP).map((p) => ({ ...p, side: 'right' as Side })),
        ...row(sideOf('top'), 16, w - 16, 14).map((p) => ({ ...p, side: 'top' as Side })),
        ...row(sideOf('bottom'), 16, w - 16, 14).map((p) => ({ ...p, side: 'bottom' as Side })),
      ]
    : [];

  const release = () => onHold && held.forEach((c) => onHold(c, false));

  return (
    <div ref={box} className={`stage${pad.profile.output === 'off' ? ' stage-off' : ''}${focus ? ' focus' : ''}`}>
      <div className="stage-floor" style={{ left: px - pw * 0.06, top: py + ph * 0.86, width: pw * 1.12 }} />
      <div className="stage-pad" style={{ left: px, top: py, width: pw, height: ph }} onPointerUp={release} onPointerLeave={release}>
        <art.Picture
          held={held}
          selected={selected}
          onPick={(part) => {
            onSelect(part);
            if (onHold && !stickOf(part) && part !== 'dpad') onHold(part as Control, true);
          }}
          left={pad.held.left}
          right={pad.held.right}
          controls={pad.controls}
          sticks={pad.sticks}
        />
      </div>
      <svg className="stage-lines" width={w} height={h} aria-hidden>
        {layout.map((c) => {
          const part = c.id as Part;
          let d: string;
          if (c.side === 'left' || c.side === 'right') {
            const knee = c.side === 'left' ? px - 16 : px + pw + 16;
            const end = c.side === 'left' ? px - GAP + 4 : px + pw + GAP - 4;
            d = `M${c.x} ${c.y}L${knee} ${c.at}L${end} ${c.at}`;
          } else {
            const knee = c.side === 'top' ? py - 6 : py + ph + 6;
            const end = c.side === 'top' ? topY + CALLOUT : bottomY;
            d = `M${c.x} ${c.y}L${c.at} ${knee}L${c.at} ${end}`;
          }
          return (
            <g key={c.id} className={`leader${lit(pad, part) ? ' lit' : ''}${selected === part ? ' selected' : ''}`}>
              <path d={d} />
              <circle cx={c.x} cy={c.y} r="3" />
            </g>
          );
        })}
      </svg>
      {layout.map((c) => {
        const part = c.id as Part;
        const to = sends(pad, part);
        const press = pressNote(pad, part);
        // a column's callout sits with its chip's middle on the leader
        const style =
          c.side === 'left'
            ? { top: c.at - FROM - 2 - CHIP / 2, right: w - (px - GAP) }
            : c.side === 'right'
              ? { top: c.at - FROM - 2 - CHIP / 2, left: px + pw + GAP }
              : { top: c.side === 'top' ? topY : bottomY, left: c.at };
        return (
          <button
            key={c.id}
            type="button"
            className={`callout ${c.side}${lit(pad, part) ? ' lit' : ''}${selected === part ? ' selected' : ''}${to ? '' : ' empty'}`}
            style={style}
            onClick={() => onSelect(part)}
          >
            <span className="callout-from">{partName(pad, part)}</span>
            <span className="callout-row">
              <span className="callout-to">{to ?? 'nothing'}</span>
              {press && <span className="callout-press">{press}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

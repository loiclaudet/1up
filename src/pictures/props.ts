import type { JSX } from 'react';
import type { Control, Stick } from '../types';

/// a callout's id: a control, `stick:left` and `stick:right` (the d-pad has a left and a right of its own), or
/// `dpad`, the d-pad as one when its four arms go to one place
export type Part = Control | `stick:${Stick}` | 'dpad';

/// which side of the pad a control's callout goes: by default the half it sits in
export type Side = 'left' | 'right' | 'top' | 'bottom';
export type Anchor = [x: number, y: number, side?: Side];

/// what every pad picture takes: what is held (lit), what is being edited, a click on a part, the sticks
export interface PadPictureProps {
  held: Set<Control>;
  selected: Part | null;
  onPick?: (part: Part) => void;
  left: [number, number];
  right: [number, number];
  /// what the pad has, for the schematic drawn when its own picture does not exist yet
  controls?: Control[];
  sticks?: Stick[];
}

/// a pad's picture and where each control sits on it (in its viewBox), for the callouts
export interface PadArt {
  w: number;
  h: number;
  Picture: (props: PadPictureProps) => JSX.Element;
  anchors: Partial<Record<Control, Anchor>>;
  /// the sticks' callouts, at the edge of each stick
  sticks?: Partial<Record<Stick, Anchor>>;
  /// the d-pad's middle, for its callout as one
  dpad?: Anchor;
}

const ARMS: string[] = ['up', 'down', 'left', 'right'];

/// a part's group: its state as classes, a click to edit it. the d-pad edited as one marks its four arms
export function control(c: Part, props: PadPictureProps) {
  const held = props.held.has(c as Control);
  const selected = props.selected === c || (props.selected === 'dpad' && ARMS.includes(c));
  return {
    'data-part': c,
    className: `pad-control${held ? ' held' : ''}${selected ? ' selected' : ''}`,
    onPointerDown: props.onPick ? () => props.onPick?.(c) : undefined,
  };
}

/// a stick's tilt, -1..1 each way, from SDL's axes
export const tilt = ([x, y]: [number, number]): [number, number] => [x / 32767, y / 32767];

// the defaults and presets of src-tauri/src/mapping.rs, for the browser's demo (mock.ts) and for the page to show
// which xbox targets a pad's presses reach now. the app's own copy decides what is sent

import type { Control, Family, Held, Preset, Profile, Stick, XTarget } from './types';

const NES: Control[] = ['up', 'down', 'left', 'right', 'minus', 'plus', 'b', 'a', 'l', 'r'];
const FAMICOM2: Control[] = ['up', 'down', 'left', 'right', 'b', 'a', 'l', 'r'];
const SNES: Control[] = ['up', 'down', 'left', 'right', 'minus', 'plus', 'y', 'x', 'b', 'a', 'l', 'r', 'zl', 'zr'];
const SWITCH: Control[] = [
  'up', 'down', 'left', 'right', 'minus', 'plus', 'home', 'capture',
  'y', 'x', 'b', 'a', 'l', 'r', 'zl', 'zr', 'lstick', 'rstick',
];

export function controlsOf(family: Family): Control[] {
  if (family === 'nes' || family === 'famicom1') return NES;
  if (family === 'famicom2') return FAMICOM2;
  if (family === 'snes') return SNES;
  return SWITCH;
}

export function sticksOf(family: Family): Stick[] {
  if (['nes', 'famicom1', 'famicom2', 'snes'].includes(family)) return [];
  if (family === 'joy_con_left' || family === 'joy_con_right') return ['left'];
  return ['left', 'right'];
}

const REST: [Control, XTarget][] = [
  ['l', 'lb'], ['r', 'rb'], ['zl', 'lt'], ['zr', 'rt'], ['minus', 'back'], ['plus', 'start'], ['home', 'guide'],
  ['lstick', 'ls'], ['rstick', 'rs'], ['up', 'up'], ['down', 'down'], ['left', 'left'], ['right', 'right'],
];

export function presetXbox(family: Family, preset: Preset): Profile['xbox'] {
  const faces: [Control, XTarget][] =
    preset === 'position'
      ? [['a', 'b'], ['b', 'a'], ['x', 'y'], ['y', 'x']]
      : [['a', 'a'], ['b', 'b'], ['x', 'x'], ['y', 'y']];
  const has = controlsOf(family);
  return Object.fromEntries([...faces, ...REST].filter(([c]) => has.includes(c)));
}

/// scan codes (set 1), as retroarch's keyboard defaults
export const SCAN = {
  up: 0xe048, down: 0xe050, left: 0xe04b, right: 0xe04d, enter: 0x1c, rshift: 0x36,
  z: 0x2c, x: 0x2d, a: 0x1e, s: 0x1f, q: 0x10, w: 0x11,
} as const;

export function defaultProfile(family: Family): Profile {
  const keys: [Control, number][] = [
    ['up', SCAN.up], ['down', SCAN.down], ['left', SCAN.left], ['right', SCAN.right],
    ['b', SCAN.z], ['a', SCAN.x], ['y', SCAN.a], ['x', SCAN.s], ['l', SCAN.q], ['r', SCAN.w],
    ['minus', SCAN.rshift], ['plus', SCAN.enter],
  ];
  const has = controlsOf(family);
  const sticks = sticksOf(family);
  return {
    output: 'xbox',
    preset: 'position',
    xbox: presetXbox(family, 'position'),
    xbox_sticks: Object.fromEntries(sticks.map((s) => [s, s === 'left' ? 'lstick' : 'rstick'])),
    keys: Object.fromEntries(keys.filter(([c]) => has.includes(c))),
    key_sticks: Object.fromEntries(sticks.map((s) => [s, s === 'left' ? 'arrows' : 'wasd'])),
  };
}

/// the xbox targets a pad reaches now: its held controls through its profile, and its sticks past half way
export function xboxLit(profile: Profile, held: Held): Set<XTarget> {
  const lit = new Set<XTarget>();
  for (const c of held.controls) {
    const t = profile.xbox[c];
    if (t) lit.add(t);
  }
  for (const stick of ['left', 'right'] as Stick[]) {
    const [x, y] = stick === 'left' ? held.left : held.right;
    const to = profile.xbox_sticks[stick];
    if (!to) continue;
    const pushed: [boolean, string][] = [[y < -16384, 'up'], [y > 16384, 'down'], [x < -16384, 'left'], [x > 16384, 'right']];
    for (const [on, dir] of pushed) {
      if (!on) continue;
      lit.add((to === 'dpad' ? dir : `${to}-${dir}`) as XTarget);
    }
  }
  return lit;
}

/// the keys a pad holds down now
export function keysLit(profile: Profile, held: Held): Set<number> {
  const lit = new Set<number>();
  for (const c of held.controls) {
    const k = profile.keys[c];
    if (k !== undefined) lit.add(k);
  }
  return lit;
}

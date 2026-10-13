// the words the page shows: a control as its pad prints it, a target as an xbox 360 pad names it, a key by name

import { keyName } from './keys';
import type { Control, Family, Stick, StickKeys, StickTarget, XTarget } from './types';

const CLASSIC: Family[] = ['nes', 'famicom1', 'famicom2', 'snes', 'n64', 'genesis'];

export function controlName(c: Control | Stick, family: Family): string {
  const classic = CLASSIC.includes(family);
  switch (c) {
    case 'minus':
      return classic ? 'Select' : '−';
    case 'plus':
      return classic ? 'Start' : '+';
    case 'zl':
      return 'ZL';
    case 'zr':
      return 'ZR';
    case 'lstick':
      return 'Left stick press';
    case 'rstick':
      return 'Right stick press';
    case 'home':
      return 'Home';
    case 'capture':
      return 'Capture';
    case 'up':
      return 'Up';
    case 'down':
      return 'Down';
    case 'left':
      return 'Left';
    case 'right':
      return 'Right';
    default:
      if (c.startsWith('other')) return `Button ${c.slice(5)}`;
      return c.toUpperCase();
  }
}

/// a stick, as a callout names it (the controls `left`, `right` are the d-pad's)
export function stickName(s: Stick): string {
  return s === 'left' ? 'Left stick' : 'Right stick';
}

const DIRS: Record<string, string> = { up: '↑', down: '↓', left: '←', right: '→' };

export function targetName(t: XTarget): string {
  const stick = /^(l|r)stick-(up|down|left|right)$/.exec(t);
  if (stick) return `${stick[1] === 'l' ? 'Left' : 'Right'} stick ${DIRS[stick[2]]}`;
  switch (t) {
    case 'lb':
    case 'rb':
    case 'lt':
    case 'rt':
    case 'ls':
    case 'rs':
      return t.toUpperCase();
    case 'back':
      return 'Back';
    case 'start':
      return 'Start';
    case 'guide':
      return 'Guide';
    case 'up':
    case 'down':
    case 'left':
    case 'right':
      return `D-pad ${DIRS[t]}`;
    default:
      return t.toUpperCase();
  }
}

export function stickTargetName(t: StickTarget): string {
  return t === 'lstick' ? 'Left stick' : t === 'rstick' ? 'Right stick' : 'D-pad';
}

export function stickKeysName(k: StickKeys): string {
  return k === 'arrows' ? 'Arrow keys' : 'W A S D';
}

export { keyName };

/// a pad's name without the maker's, and the famicom's in the word its players use: "NES Controller (L)",
/// "Famicom Controller (2)"
export function padName(name: string): string {
  return name.replace(/^Nintendo\s+/, '').replace(/Family Computer|HVC/, 'Famicom');
}

// a demo engine for the browser: two pads (a nes pad and a switch pro), their profiles changed as the app would.
// the url drives it for screenshots: ?press=a,up holds controls, ?left=-30000,0 pushes the left stick

import { controlsOf, defaultProfile, presetXbox, sticksOf } from './profile';
import type { Change, Control, Family, PadView, View } from './types';

const params = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
const pressed = (params.get('press') ?? '').split(',').filter(Boolean) as Control[];
const stick = (name: string): [number, number] => {
  const [x, y] = (params.get(name) ?? '0,0').split(',').map(Number);
  return [x || 0, y || 0];
};

function pad(id: number, name: string, family: Family, kind: string, product: number): PadView {
  return {
    id,
    name,
    family,
    controls: controlsOf(family),
    sticks: sticksOf(family),
    held: { controls: [], left: [0, 0], right: [0, 0] },
    profile: defaultProfile(family),
    slot: id,
    guid: `demo-${id}`,
    vendor: 0x057e,
    product,
    kind,
    mapping: '',
  };
}

const view: View = {
  driver: 'preview',
  pads: [
    pad(1, 'Nintendo NES Controller (L)', 'nes', 'standard', 0x2007),
    pad(2, 'Nintendo Switch Pro Controller', 'switch_pro', 'switchpro', 0x2009),
    pad(3, 'Nintendo Family Computer Controller (1)', 'famicom1', 'standard', 0x2007),
    pad(4, 'Nintendo Family Computer Controller (2)', 'famicom2', 'standard', 0x2007),
  ],
};
for (const p of view.pads) {
  p.held = { controls: pressed.filter((c) => p.controls.includes(c)), left: stick('left'), right: stick('right') };
}

let listener: ((view: View) => void) | null = null;

function emit() {
  listener?.(structuredClone(view));
}

export function subscribe(onView: (view: View) => void) {
  listener = onView;
  emit();
}

export function change(id: number, c: Change) {
  const p = view.pads.find((p) => p.id === id);
  if (!p) return;
  const profile = p.profile;
  switch (c.do) {
    case 'output':
      profile.output = c.output;
      break;
    case 'preset':
      profile.preset = c.preset;
      profile.xbox = presetXbox(p.family, c.preset);
      break;
    case 'reset':
      p.profile = defaultProfile(p.family);
      break;
    case 'xbox':
      if (c.target) profile.xbox[c.control] = c.target;
      else delete profile.xbox[c.control];
      break;
    case 'key':
      if (c.key !== null) profile.keys[c.control] = c.key;
      else delete profile.keys[c.control];
      break;
    case 'xbox-stick':
      if (c.target) profile.xbox_sticks[c.stick] = c.target;
      else delete profile.xbox_sticks[c.stick];
      break;
    case 'key-stick':
      if (c.keys) profile.key_sticks[c.stick] = c.keys;
      else delete profile.key_sticks[c.stick];
      break;
  }
  emit();
}

/// the demo's presses from the page's own keyboard and clicks: a control held while the pointer is down on it
export function hold(id: number, control: Control, down: boolean) {
  const p = view.pads.find((p) => p.id === id);
  if (!p) return;
  const held = new Set(p.held.controls);
  if (down) held.add(control);
  else held.delete(control);
  p.held = { ...p.held, controls: [...held] };
  emit();
}

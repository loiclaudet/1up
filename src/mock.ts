// a demo engine for the browser: a pad of each family, their profiles changed as the app would. the url drives it for
// screenshots: ?press=a,up holds controls on the pad shown, ?left=-30000,0 pushes its left stick, ?driver=ready shows
// windows with the driver (missing: without it; the default, preview: a mac), ?pads=snes,nes plugs in those families,
// ?update=0.1.1 has a newer 1up out

import { controlsOf, defaultProfile, presetXbox, sticksOf } from './profile';
import type { Change, Control, Driver, Family, PadView, View } from './types';

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
    // xinput numbers four pads
    slot: id <= 4 ? id : null,
    guid: `demo-${id}`,
    vendor: 0x057e,
    product,
    kind,
    mapping: '',
  };
}

const PADS: [string, Family, string, number][] = [
  ['Nintendo NES Controller (L)', 'nes', 'standard', 0x2007],
  ['Nintendo Switch Pro Controller', 'switch_pro', 'switchpro', 0x2009],
  ['Nintendo Family Computer Controller (1)', 'famicom1', 'standard', 0x2007],
  ['Nintendo Family Computer Controller (2)', 'famicom2', 'standard', 0x2007],
  ['Nintendo SNES Controller', 'snes', 'standard', 0x2017],
  ['Nintendo Switch Joy-Con (L/R)', 'joy_con_pair', 'joyconpair', 0x2008],
  // only when asked for: pads drawn as the schematic
  ['Nintendo N64 Controller', 'n64', 'n64', 0x2019],
  ['Nintendo Switch Joy-Con (L)', 'joy_con_left', 'joyconleft', 0x2006],
];
const families = (params.get('pads') ?? '').split(',').filter(Boolean);
const plugged = families.length ? families.flatMap((f) => PADS.filter((p) => p[1] === f)) : PADS.slice(0, 6);
const driver = params.get('driver');
const view: View = {
  driver: driver === 'ready' || driver === 'missing' ? (driver as Driver) : 'preview',
  pads: plugged.map(([name, family, kind, product], i) => pad(i + 1, name, family, kind, product)),
};
// the presses and the sticks are the shown pad's (?pad=2), the others at rest
const shown = Number(params.get('pad') ?? 1);
for (const p of view.pads) {
  if (p.id === shown)
    p.held = { controls: pressed.filter((c) => p.controls.includes(c)), left: stick('left'), right: stick('right') };
  if (view.driver === 'missing') p.slot = null;
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

/// the demo's report, shaped as the app's
export function report(): string {
  const lines = view.pads.map(
    (p) =>
      `\n${p.name} · ${p.family} · sdl type ${p.kind} · ${p.vendor.toString(16).padStart(4, '0')}:${p.product.toString(16).padStart(4, '0')}\n` +
      `  guid ${p.guid}\n  output ${p.profile.output} · preset ${p.profile.preset}\n  holds ${p.held.controls.join(' ') || 'nothing'}`,
  );
  return `1up demo · ${navigator.platform} · preview\n${lines.join('\n')}\n`;
}

/// the demo's driver install: windows' prompt, then the installer, played as a short wait
export function installDriver(): Promise<boolean> {
  return new Promise((done) =>
    setTimeout(() => {
      view.driver = 'ready';
      for (const p of view.pads) p.slot = p.id <= 4 ? p.id : null;
      emit();
      done(true);
    }, 1800),
  );
}

/// the demo's newer 1up, when the url names one: installing it takes a moment, then the page reloads
export function update(): Promise<{ version: string; install(): Promise<void> } | null> {
  const version = params.get('update');
  if (!version) return Promise.resolve(null);
  return Promise.resolve({
    version,
    install: () => new Promise<void>((done) => setTimeout(() => (location.search = '', done()), 2400)),
  });
}

/// the demo's login item
export const startup = { on: false };

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

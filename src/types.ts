// the app's view and changes, as src-tauri/src/engine.rs and mapping.rs serialize them

export type Control =
  | 'a' | 'b' | 'x' | 'y' | 'l' | 'r' | 'zl' | 'zr'
  | 'minus' | 'plus' | 'home' | 'capture' | 'lstick' | 'rstick'
  | 'up' | 'down' | 'left' | 'right'
  | `other${number}`;

export type Stick = 'left' | 'right';

export type Family =
  | 'nes' | 'famicom1' | 'famicom2' | 'snes' | 'n64' | 'genesis'
  | 'switch_pro' | 'joy_con_left' | 'joy_con_right' | 'joy_con_pair' | 'nintendo';

export type Output = 'xbox' | 'keys' | 'off';
export type Preset = 'position' | 'label';
export type Dir = 'up' | 'down' | 'left' | 'right';

export type XButton =
  | 'a' | 'b' | 'x' | 'y' | 'lb' | 'rb' | 'lt' | 'rt' | 'back' | 'start' | 'guide' | 'ls' | 'rs'
  | 'up' | 'down' | 'left' | 'right';
export type XTarget = XButton | `lstick-${Dir}` | `rstick-${Dir}`;
export type StickTarget = 'lstick' | 'rstick' | 'dpad';
export type StickKeys = 'arrows' | 'wasd';

export interface Profile {
  output: Output;
  preset: Preset;
  xbox: Partial<Record<Control, XTarget>>;
  xbox_sticks: Partial<Record<Stick, StickTarget>>;
  keys: Partial<Record<Control, number>>;
  key_sticks: Partial<Record<Stick, StickKeys>>;
}

export interface Held {
  controls: Control[];
  left: [number, number];
  right: [number, number];
}

export interface PadView {
  id: number;
  name: string;
  family: Family;
  controls: Control[];
  sticks: Stick[];
  held: Held;
  profile: Profile;
  slot: number | null;
  guid: string;
  vendor: number;
  product: number;
  kind: string;
  mapping: string;
}

export type Driver = 'ready' | 'missing' | 'preview';

export interface View {
  driver: Driver;
  pads: PadView[];
}

export type Change =
  | { do: 'output'; output: Output }
  | { do: 'preset'; preset: Preset }
  | { do: 'reset' }
  | { do: 'xbox'; control: Control; target: XTarget | null }
  | { do: 'key'; control: Control; key: number | null }
  | { do: 'xbox-stick'; stick: Stick; target: StickTarget | null }
  | { do: 'key-stick'; stick: Stick; keys: StickKeys | null };

// the page and the app: a view pushed on each change (`subscribe`), changes sent back (`change`). outside the app
// (a browser, `pnpm dev`) or with `?mock`, a demo engine stands in (mock.ts)

import { Channel, invoke } from '@tauri-apps/api/core';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { openUrl, revealItemInDir } from '@tauri-apps/plugin-opener';
import type { Change, View } from './types';
import * as mock from './mock';

const inApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
export const demo = !inApp || new URLSearchParams(location.search).has('mock');

export function subscribe(onView: (view: View) => void): void {
  if (demo) return mock.subscribe(onView);
  const channel = new Channel<View>();
  channel.onmessage = onView;
  invoke('subscribe', { channel }).catch((e) => console.error('1up: subscribe', e));
}

export function change(pad: number, change: Change): Promise<void> {
  if (demo) return Promise.resolve(mock.change(pad, change));
  return invoke('change', { pad, change });
}

/// the text for a bug report, and the folder of the log file
export function details(): Promise<[string, string]> {
  if (demo) return Promise.resolve([mock.report(), '(the demo keeps no log)']);
  return invoke('details');
}

/// starting with windows, as a login item
export const startup = {
  get: (): Promise<boolean> => (demo ? Promise.resolve(mock.startup.on) : isEnabled()),
  set: (on: boolean): Promise<void> => {
    if (demo) {
      mock.startup.on = on;
      return Promise.resolve();
    }
    return on ? enable() : disable();
  },
};

/// a link, in the person's browser
export function openLink(url: string) {
  if (demo) window.open(url, '_blank', 'noreferrer');
  else openUrl(url).catch((e) => console.error('1up: open', e));
}

/// a folder, in the file explorer
export function reveal(path: string) {
  if (!demo) revealItemInDir(path).catch((e) => console.error('1up: reveal', e));
}

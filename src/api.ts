// the page and the app: a view pushed on each change (`subscribe`), changes sent back (`change`). outside the app
// (a browser, `pnpm dev`) or with `?mock`, a demo engine stands in (mock.ts)

import { Channel, invoke } from '@tauri-apps/api/core';
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

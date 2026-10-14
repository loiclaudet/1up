// the page and the app: a view pushed on each change (`subscribe`), changes sent back (`change`). outside the app
// (a browser, `pnpm dev`) or with `?mock`, a demo engine stands in (mock.ts)

import { Channel, invoke } from '@tauri-apps/api/core';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { openUrl, revealItemInDir } from '@tauri-apps/plugin-opener';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
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

/// the xbox pads' driver, installed with vigembus's installer that 1up ships: windows asks first. true once it ran,
/// false when this 1up has no installer to run (a build of one's own); rejected when declined or failed
export function installDriver(): Promise<boolean> {
  if (demo) return mock.installDriver();
  return invoke('install_driver');
}

/// a newer 1up, found on github: installing it closes 1up, and the installer opens it again
export interface Update {
  version: string;
  install(): Promise<void>;
}

/// whether a newer 1up is out (github's latest.json, checked against 1up's signature); never in a dev build
export async function checkUpdate(): Promise<Update | null> {
  if (demo) return mock.update();
  if (import.meta.env.DEV) return null;
  const update = await check();
  if (!update) return null;
  return {
    version: update.version,
    install: async () => {
      // on windows the installer takes over here and 1up quits; elsewhere it comes back and restarts
      await update.downloadAndInstall();
      await relaunch();
    },
  };
}

/// a link, in the person's browser
export function openLink(url: string) {
  if (demo) window.open(url, '_blank', 'noreferrer');
  else openUrl(url).catch((e) => console.error('1up: open', e));
}

/// a folder, in the file explorer
export function reveal(path: string) {
  if (!demo) revealItemInDir(path).catch((e) => console.error('1up: reveal', e));
}

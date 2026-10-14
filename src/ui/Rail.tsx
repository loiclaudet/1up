// the rail: the pads plugged in, each drawn small, with where it goes; at the bottom a newer 1up when one is out, and
// the xbox pads' driver

import { useEffect, useState } from 'react';
import { installDriver, openLink, startup, type Update } from '../api';
import { artOf } from '../pictures';
import { padName } from '../labels';
import { Logo } from './Logo';
import type { Driver, PadView } from '../types';

export function destination(pad: PadView, driver: Driver): string {
  switch (pad.profile.output) {
    case 'off':
      return 'Off';
    case 'keys':
      return 'Types keys';
    case 'xbox':
      if (pad.slot) return `Xbox pad ${pad.slot}`;
      return driver === 'missing' ? 'Needs its driver' : driver === 'preview' ? 'Xbox pad, on Windows' : 'Xbox pad';
  }
}

/// start 1up with windows, in the tray: the pads ready before any game
function StartWithWindows() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    startup.get().then(setOn, () => setOn(false));
  }, []);
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={on ?? false}
        disabled={on === null}
        onChange={(e) => {
          const next = e.target.checked;
          setOn(next);
          startup.set(next).catch(() => setOn(!next));
        }}
      />
      <span className="switch-track" aria-hidden />
      <span>Start with Windows</span>
    </label>
  );
}

/// the xbox pads' driver: ready, or a button that installs it (1up's installer does, unless windows was told no)
function DriverNote({ driver }: { driver: Driver }) {
  const [install, setInstall] = useState<'idle' | 'running' | 'failed' | 'ran'>('idle');
  if (driver === 'ready')
    return (
      <p>
        <span className="dot ready" /> Xbox pads ready
      </p>
    );
  if (driver === 'preview')
    return (
      <p>
        <span className="dot preview" /> Preview. 1up sends to games on Windows.
      </p>
    );
  if (install === 'running')
    return (
      <p aria-live="polite">
        <span className="dot running" /> Installing the driver. Windows asks you to allow it.
      </p>
    );
  const run = () => {
    setInstall('running');
    installDriver().then(
      (ran) => {
        if (!ran) openLink('https://github.com/nefarius/ViGEmBus/releases/latest');
        setInstall(ran ? 'ran' : 'idle');
      },
      () => setInstall('failed'),
    );
  };
  return (
    <p aria-live="polite">
      <span className="dot missing" />{' '}
      {install === 'ran' ? (
        <>Installed. If Xbox pads don’t come, restart Windows.</>
      ) : (
        <>
          {install === 'failed' ? 'The driver didn’t install.' : 'Xbox pads need a driver.'} Keys work without
          it.{' '}
          <button type="button" className="link" onClick={run}>
            {install === 'failed' ? 'Try again' : 'Install it'}
          </button>
        </>
      )}
    </p>
  );
}

/// a newer 1up: one click downloads it, and its installer replaces this one and opens it again
function UpdateNote({ update }: { update: Update }) {
  const [state, setState] = useState<'idle' | 'running' | 'failed'>('idle');
  if (state === 'running')
    return (
      <p className="update" aria-live="polite">
        <span className="dot running" /> Updating to {update.version}. 1up opens again on its own.
      </p>
    );
  return (
    <p className="update" aria-live="polite">
      <span className="dot ready" /> {state === 'failed' ? 'The update didn’t install.' : `1up ${update.version} is out.`}{' '}
      <button
        type="button"
        className="link"
        onClick={() => {
          setState('running');
          update.install().catch((e) => {
            console.error('1up: update', e);
            setState('failed');
          });
        }}
      >
        {state === 'failed' ? 'Try again' : 'Update'}
      </button>
    </p>
  );
}

export function Rail({
  pads,
  driver,
  update,
  current,
  onPick,
}: {
  pads: PadView[];
  driver: Driver;
  update: Update | null;
  current: number | null;
  onPick: (id: number) => void;
}) {
  return (
    <nav className="rail" aria-label="pads">
      <div className="brand">
        <Logo height={44} />
      </div>
      <p className="eyebrow rail-title">Pads</p>
      <ul className="pad-list">
        {pads.map((pad) => {
          const art = artOf(pad.family);
          return (
            <li key={pad.id}>
              <button type="button" className={`pad-item${pad.id === current ? ' on' : ''}`} onClick={() => onPick(pad.id)}>
                <span className="thumb" aria-hidden>
                  <art.Picture
                    held={new Set(pad.held.controls)}
                    selected={null}
                    left={pad.held.left}
                    right={pad.held.right}
                    controls={pad.controls}
                    sticks={pad.sticks}
                  />
                </span>
                <span className="pad-item-text">
                  <span className="pad-item-name">{padName(pad.name)}</span>
                  <span className={`pad-item-dest ${pad.profile.output}`}>{destination(pad, driver)}</span>
                </span>
              </button>
            </li>
          );
        })}
        {pads.length === 0 && <li className="pad-list-empty">No pad yet</li>}
      </ul>
      <footer className="driver">
        {update && <UpdateNote update={update} />}
        <StartWithWindows />
        <DriverNote driver={driver} />
      </footer>
    </nav>
  );
}

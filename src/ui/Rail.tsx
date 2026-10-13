// the rail: the pads plugged in, each drawn small, with where it goes; vigembus's state at the bottom

import { artOf } from '../pictures';
import { padName } from '../labels';
import type { Driver, PadView } from '../types';

export function destination(pad: PadView, driver: Driver): string {
  switch (pad.profile.output) {
    case 'off':
      return 'Off';
    case 'keys':
      return 'Types keys';
    case 'xbox':
      if (pad.slot) return `Xbox pad ${pad.slot}`;
      return driver === 'missing' ? 'Needs ViGEmBus' : driver === 'preview' ? 'Xbox pad, on Windows' : 'Xbox pad';
  }
}

export function Rail({
  pads,
  driver,
  current,
  onPick,
}: {
  pads: PadView[];
  driver: Driver;
  current: number | null;
  onPick: (id: number) => void;
}) {
  return (
    <nav className="rail" aria-label="pads">
      <div className="brand">
        <span className="wordmark">1up</span>
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
        {driver === 'ready' && (
          <p>
            <span className="dot ready" /> Xbox pads ready
          </p>
        )}
        {driver === 'missing' && (
          <p>
            <span className="dot missing" /> Xbox pads need{' '}
            <a href="https://github.com/nefarius/ViGEmBus/releases/latest" target="_blank" rel="noreferrer">
              ViGEmBus
            </a>
            . Keys work without it.
          </p>
        )}
        {driver === 'preview' && (
          <p>
            <span className="dot preview" /> Preview. 1up sends to games on Windows.
          </p>
        )}
      </footer>
    </nav>
  );
}

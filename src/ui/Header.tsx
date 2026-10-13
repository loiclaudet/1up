// above the stage: the pad's name, where it goes (an xbox pad, keys, nothing), and for an xbox pad, how its face
// buttons line up

import { padName } from '../labels';
import type { Change, Driver, Output, PadView, Preset } from '../types';
import { destination } from './Rail';

const OUTPUTS: [Output, string][] = [
  ['xbox', 'Xbox pad'],
  ['keys', 'Keys'],
  ['off', 'Off'],
];

const PRESETS: [Preset, string, string][] = [
  ['position', 'By position', 'Face buttons by position: A, on the right, is the Xbox pad’s B. What most games and emulators expect.'],
  ['label', 'By label', 'Face buttons by label: A is A and B is B, as printed, wherever they sit.'],
];

export function Header({
  pad,
  driver,
  onChange,
  onDetails,
}: {
  pad: PadView;
  driver: Driver;
  onChange: (c: Change) => void;
  onDetails: () => void;
}) {
  const { output, preset } = pad.profile;
  const hasFace = pad.controls.includes('a');
  return (
    <header className="pad-header">
      <div className="pad-title">
        <h1>{padName(pad.name)}</h1>
        <p className="meta">{destination(pad, driver)}</p>
      </div>
      <div className="pad-settings">
        <div className="segmented" role="radiogroup" aria-label="output">
          {OUTPUTS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={output === value}
              className={output === value ? 'on' : ''}
              onClick={() => onChange({ do: 'output', output: value })}
            >
              {label}
            </button>
          ))}
        </div>
        {output === 'xbox' && hasFace && (
          <div className="preset">
            <div className="segmented small" role="radiogroup" aria-label="face buttons">
              {PRESETS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={preset === value}
                  className={preset === value ? 'on' : ''}
                  onClick={() => onChange({ do: 'preset', preset: value })}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="note" role="tooltip">
              {PRESETS.find(([value]) => value === preset)?.[2]}
            </p>
          </div>
        )}
        <button type="button" className="ghost reset" onClick={() => onChange({ do: 'reset' })}>
          Reset
        </button>
        <button type="button" className="ghost" onClick={onDetails}>
          Details
        </button>
      </div>
    </header>
  );
}

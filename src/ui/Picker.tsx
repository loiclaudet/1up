// the drawer that edits one part: what it sends on the xbox pad (a button, a trigger, a stick pushed one way), or
// which key it types. a stick goes to a stick, the d-pad, or four keys, and its press is a button of its own; the
// d-pad as one goes where its four arms go

import { useEffect, useState, type ReactNode } from 'react';
import type { Part } from '../pictures';
import { keyName, stickKeysName, stickTargetName, targetName } from '../labels';
import { scanOf } from '../keys';
import { SCAN } from '../profile';
import type { Change, Control, PadView, StickKeys, StickTarget, XTarget } from '../types';
import { dpadAsOne, partName, stickOf } from './Stage';

const ARMS = ['up', 'down', 'left', 'right'] as const;

export function Picker({
  pad,
  part,
  onChange,
  onClose,
}: {
  pad: PadView;
  part: Part;
  onChange: (c: Change) => void;
  onClose: () => void;
}) {
  const stick = stickOf(part);
  const { output } = pad.profile;
  const p = pad.profile;
  let body: ReactNode;
  if (output === 'off') {
    body = (
      <div className="picker-off">
        <p>This pad sends nothing while it is off.</p>
        <div className="row">
          <button type="button" className="solid" onClick={() => onChange({ do: 'output', output: 'xbox' })}>
            Make it an Xbox pad
          </button>
          <button type="button" className="ghost" onClick={() => onChange({ do: 'output', output: 'keys' })}>
            Type keys
          </button>
        </div>
      </div>
    );
  } else if (part === 'dpad') {
    body = <DpadChoice pad={pad} onChange={onChange} />;
  } else if (stick) {
    const press: Control = stick === 'left' ? 'lstick' : 'rstick';
    body = (
      <div className="targets">
        <Choices
          title={output === 'xbox' ? 'Goes to' : 'Pushed, it types'}
          options={
            output === 'xbox'
              ? (['lstick', 'rstick', 'dpad'] as StickTarget[]).map((s) => [s, stickTargetName(s)])
              : (['arrows', 'wasd'] as StickKeys[]).map((k) => [k, stickKeysName(k)])
          }
          current={output === 'xbox' ? p.xbox_sticks[stick] : p.key_sticks[stick]}
          onPick={(to) =>
            onChange(
              output === 'xbox'
                ? { do: 'xbox-stick', stick, target: to as StickTarget | null }
                : { do: 'key-stick', stick, keys: to as StickKeys | null },
            )
          }
        />
        <p className="hint">Pushed past half way, a stick counts on the d-pad and as keys.</p>
        <div className="divider" />
        <h3 className="subhead">Pressing it {output === 'xbox' ? 'sends' : 'types'}</h3>
        {output === 'xbox' ? (
          <XboxTargets current={p.xbox[press]} onPick={(target) => onChange({ do: 'xbox', control: press, target })} />
        ) : (
          <KeyCapture armed={false} current={p.keys[press]} onPick={(key) => onChange({ do: 'key', control: press, key })} onClose={onClose} />
        )}
      </div>
    );
  } else if (output === 'xbox') {
    body = <XboxTargets current={p.xbox[part as Control]} onPick={(target) => onChange({ do: 'xbox', control: part as Control, target })} />;
  } else {
    body = <KeyCapture armed current={p.keys[part as Control]} onPick={(key) => onChange({ do: 'key', control: part as Control, key })} onClose={onClose} />;
  }
  return (
    <aside className="picker" aria-label={`edit ${partName(pad, part)}`}>
      <header className="picker-head">
        <div>
          <p className="eyebrow">{output === 'keys' ? 'Types' : output === 'xbox' ? 'Sends, on the Xbox pad' : 'Sends'}</p>
          <h2>{partName(pad, part)}</h2>
        </div>
        <button type="button" className="ghost close" onClick={onClose}>
          Done
        </button>
      </header>
      {body}
    </aside>
  );
}

function Option({ on, onClick, children, className = '' }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" className={`target ${className}${on ? ' on' : ''}`} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

function Nothing({ on, onPick }: { on: boolean; onPick: () => void }) {
  return (
    <button type="button" className={`nothing${on ? ' on' : ''}`} onClick={onPick}>
      Nothing
    </button>
  );
}

function Choices({
  title,
  options,
  current,
  onPick,
}: {
  title: string;
  options: [string, string][];
  current: string | null | undefined;
  onPick: (to: string | null) => void;
}) {
  return (
    <section>
      <h3>{title}</h3>
      <div className="list">
        {options.map(([value, label]) => (
          <Option key={value} on={current === value} onClick={() => onPick(value)} className="wide">
            {label}
          </Option>
        ))}
        <Nothing on={current === null || current === undefined} onPick={() => onPick(null)} />
      </div>
    </section>
  );
}

/// the d-pad as one: its four arms to the xbox pad's d-pad or a stick, or to the arrows or W A S D
function DpadChoice({ pad, onChange }: { pad: PadView; onChange: (c: Change) => void }) {
  const xbox = pad.profile.output === 'xbox';
  const current = dpadAsOne(pad);
  const options: [string, string][] = xbox
    ? [
        ['', 'D-pad'],
        ['lstick-', 'Left stick'],
        ['rstick-', 'Right stick'],
      ]
    : [
        ['arrows', 'Arrow keys'],
        ['wasd', 'W A S D'],
      ];
  const label = options.find(([, name]) => name === current)?.[0];
  const pick = (to: string | null) => {
    ARMS.forEach((arm, i) => {
      if (xbox) onChange({ do: 'xbox', control: arm, target: to === null ? null : (`${to}${arm}` as XTarget) });
      else {
        const keys = to === 'arrows' ? [SCAN.up, SCAN.down, SCAN.left, SCAN.right] : [0x11, 0x1f, 0x1e, 0x20];
        onChange({ do: 'key', control: arm, key: to === null ? null : keys[i] });
      }
    });
  };
  return (
    <div className="targets">
      <Choices title={xbox ? 'Its four arms go to' : 'Its four arms type'} options={options} current={current === null ? null : label} onPick={pick} />
      <p className="hint">Click an arm on the pad to send it somewhere else alone.</p>
    </div>
  );
}

function XboxTargets({ current, onPick }: { current: XTarget | undefined; onPick: (t: XTarget | null) => void }) {
  const t = (to: XTarget, className = '', label = targetName(to)) => (
    <Option on={current === to} onClick={() => onPick(to)} className={className}>
      {label}
    </Option>
  );
  const cross = (prefix: '' | 'lstick-' | 'rstick-') => (
    <div className="cross">
      {(['up', 'left', 'right', 'down'] as const).map((d) =>
        t((prefix ? `${prefix}${d}` : d) as XTarget, `cross-${d}`, { up: '↑', down: '↓', left: '←', right: '→' }[d]),
      )}
    </div>
  );
  return (
    <div className="targets">
      <section>
        <h3>Face buttons</h3>
        <div className="diamond">
          {t('y', 'face face-top')}
          {t('x', 'face face-left')}
          {t('b', 'face face-right')}
          {t('a', 'face face-bottom')}
        </div>
      </section>
      <section>
        <h3>Shoulders and triggers</h3>
        <div className="grid2">
          {t('lb')}
          {t('rb')}
          {t('lt')}
          {t('rt')}
        </div>
      </section>
      <section className="split">
        <div>
          <h3>D-pad</h3>
          {cross('')}
        </div>
        <div>
          <h3>Left stick</h3>
          {cross('lstick-')}
        </div>
        <div>
          <h3>Right stick</h3>
          {cross('rstick-')}
        </div>
      </section>
      <section>
        <h3>Middle and stick presses</h3>
        <div className="grid3">
          {t('back')}
          {t('guide')}
          {t('start')}
          {t('ls', '', 'Left stick press')}
          {t('rs', '', 'Right stick press')}
        </div>
      </section>
      <Nothing on={!current} onPick={() => onPick(null)} />
    </div>
  );
}

/// the next key pressed, once armed: a part is armed as soon as its drawer opens, a stick's press on a click
function KeyCapture({
  armed: armedFirst,
  current,
  onPick,
  onClose,
}: {
  armed: boolean;
  current: number | undefined;
  onPick: (key: number | null) => void;
  onClose: () => void;
}) {
  const [armed, setArmed] = useState(armedFirst);
  const [refused, setRefused] = useState<string | null>(null);
  useEffect(() => {
    if (!armed) return;
    const down = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') return armedFirst ? onClose() : setArmed(false);
      const scan = scanOf(e.code);
      if (scan === undefined) return setRefused(e.key);
      setRefused(null);
      onPick(scan);
      if (!armedFirst) setArmed(false);
    };
    window.addEventListener('keydown', down, true);
    return () => window.removeEventListener('keydown', down, true);
  }, [armed, armedFirst, onPick, onClose]);
  return (
    <section className="key-capture">
      <button type="button" className={`keycap${current === undefined ? ' blank' : ''}${armed ? ' armed' : ''}`} onClick={() => setArmed(true)}>
        <span>
          {armed && <span className="listening">Listening</span>}
          {current === undefined ? (armed ? 'Press a key' : 'Set a key') : keyName(current)}
        </span>
      </button>
      <p className="hint">
        {refused
          ? `1up cannot type “${refused}”. Try another key.`
          : armed
            ? 'Press a key to change it. Esc stops.'
            : 'Click to choose the key it types.'}
      </p>
      <Nothing on={current === undefined} onPick={() => onPick(null)} />
    </section>
  );
}

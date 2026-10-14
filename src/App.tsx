import { useCallback, useEffect, useState } from 'react';
import { change, checkUpdate, demo, subscribe, type Update } from './api';
import * as mock from './mock';
import type { Part } from './pictures';
import type { Change, View } from './types';
import { Details } from './ui/Details';
import { Header } from './ui/Header';
import { Picker } from './ui/Picker';
import { Rail } from './ui/Rail';
import { Stage } from './ui/Stage';

// the demo's url knobs, for screenshots: ?pad=2 shows the second pad, ?select=a opens its picker, ?output=keys
const params = new URLSearchParams(location.search);

export function App() {
  const [view, setView] = useState<View | null>(null);
  const [padId, setPadId] = useState<number | null>(demo && params.get('pad') ? Number(params.get('pad')) : null);
  const [selected, setSelected] = useState<Part | null>(demo ? ((params.get('select') as Part | null) ?? null) : null);
  const [detailsOpen, setDetailsOpen] = useState(demo && params.has('details'));
  const [update, setUpdate] = useState<Update | null>(null);

  useEffect(() => {
    subscribe(setView);
    const output = params.get('output');
    if (demo && (output === 'keys' || output === 'off')) change(Number(params.get('pad') ?? 1), { do: 'output', output });
  }, []);

  // at launch, once 1up knows it is on windows (a mac only previews): is a newer 1up out?
  const windows = view !== null && view.driver !== 'preview';
  useEffect(() => {
    if (!windows && !demo) return;
    checkUpdate().then(setUpdate, (e) => console.warn('1up: no update check', e));
  }, [windows]);

  const pad = view?.pads.find((p) => p.id === padId) ?? view?.pads[0] ?? null;
  const send = useCallback((c: Change) => pad && change(pad.id, c), [pad]);
  const close = useCallback(() => setSelected(null), []);
  const closeDetails = useCallback(() => setDetailsOpen(false), []);

  useEffect(() => {
    if (!selected && !detailsOpen) return;
    const esc = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return;
      setSelected(null);
      setDetailsOpen(false);
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [selected, detailsOpen]);

  if (!view) return <div className="app loading" />;

  return (
    <div className={`app${(pad && selected) || detailsOpen ? ' editing' : ''}`}>
      <Rail
        pads={view.pads}
        driver={view.driver}
        update={update}
        current={pad?.id ?? null}
        onPick={(id) => {
          setPadId(id);
          setSelected(null);
        }}
      />
      <main className="main">
        {pad ? (
          <>
            <Header
              pad={pad}
              driver={view.driver}
              onChange={send}
              onDetails={() => {
                setSelected(null);
                setDetailsOpen(true);
              }}
            />
            <Stage
              pad={pad}
              selected={selected}
              onSelect={(part) => {
                setDetailsOpen(false);
                setSelected(part === selected ? null : part);
              }}
              onHold={demo ? (c, down) => mock.hold(pad.id, c, down) : undefined}
            />
          </>
        ) : (
          <Empty />
        )}
      </main>
      {pad && selected && <Picker key={`${pad.id}${selected}`} pad={pad} part={selected} onChange={send} onClose={close} />}
      {detailsOpen && !selected && <Details onClose={closeDetails} />}
    </div>
  );
}

function Empty() {
  return (
    <div className="empty">
      <h1>Plug in a pad</h1>
      <p>
        Pair it in Windows’ Bluetooth settings, then press any button on it. 1up reads the Switch Online NES, Famicom
        and SNES pads, the Switch Pro Controller and the Joy-Cons.
      </p>
    </div>
  );
}

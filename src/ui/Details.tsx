// the drawer for a bug report: what 1up knows of the system and every pad, to copy and paste, and the log file's
// folder

import { useEffect, useState } from 'react';
import { details, reveal } from '../api';

export function Details({ onClose }: { onClose: () => void }) {
  const [report, setReport] = useState<[string, string] | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    details().then(setReport);
  }, []);
  const copy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report[0]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <aside className="picker details" aria-label="details">
      <header className="picker-head">
        <div>
          <p className="eyebrow">For a bug report</p>
          <h2>Details</h2>
        </div>
        <button type="button" className="ghost close" onClick={onClose}>
          Done
        </button>
      </header>
      <p className="hint">When a pad misbehaves, copy this and paste it with what happened.</p>
      <pre className="report">{report?.[0] ?? '…'}</pre>
      <div className="row">
        <button type="button" className="solid" onClick={copy} disabled={!report}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" className="ghost" onClick={() => report && reveal(report[1])}>
          Open the log folder
        </button>
      </div>
    </aside>
  );
}

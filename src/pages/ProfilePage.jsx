import { useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useRequest } from '../state/useRequest.js';
import { useAppState } from '../state/AppState.jsx';
import { MajorChip } from '../components/Chips.jsx';
import UnitSelect from '../components/UnitSelect.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import { SystemError } from '../components/States.jsx';

// Figma S1 · Study profile
export default function ProfilePage() {
  const { major, setMajor, completed, toggleUnit, clearUnits } = useAppState();
  const [query, setQuery] = useState('');
  const majors = useRequest(() => api.getMajors(), []);
  const units = useRequest(() => api.getUnits(major), [major]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = units.data?.units || [];
    return q ? list.filter((u) => u.code.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)) : list;
  }, [units.data, query]);

  return (
    <div className="two-col">
      <div className="stack gap-8">
        <div className="page-header">
          <h1 className="t-display">Your study profile</h1>
          <p className="t-body c-secondary">Choose your target major and tick the units you have completed. Nothing here is stored after you close this tab.</p>
        </div>

        <section className="stack gap-3" aria-labelledby="step-major">
          <h2 id="step-major" className="t-label">1. Target major</h2>
          {majors.error ? <SystemError error={majors.error} onRetry={majors.retry} /> : (
            <div className="row wrap gap-2">
              {(majors.data?.majors || []).map((m) => (
                <MajorChip key={m.id} selected={m.id === major} onClick={() => setMajor(m.id)}>{m.name}</MajorChip>
              ))}
            </div>
          )}
        </section>

        <section className="stack gap-3" aria-labelledby="step-units">
          <div className="row gap-3">
            <h2 id="step-units" className="t-label">2. Completed units</h2>
            <span className="t-caption c-brand" aria-live="polite">{completed.size} selected</span>
          </div>
          <label className="field field--search">
            <Icon name="search" size={18} className="c-secondary" />
            <span className="sr-only">Search unit code or name</span>
            <input type="search" placeholder="Search unit code or name…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {units.error ? <SystemError error={units.error} onRetry={units.retry} /> : (
            <div className="unit-grid">
              {shown.map((u) => <UnitSelect key={u.code} unit={u} checked={completed.has(u.code)} onToggle={toggleUnit} />)}
              {!units.loading && shown.length === 0 && <p className="t-small c-secondary">No unit matches “{query}”.</p>}
            </div>
          )}
        </section>

        <div className="row wrap gap-3">
          <Button as="a" href="#pathway">Generate pathway</Button>
          <Button variant="ghost" onClick={clearUnits}>Clear selection</Button>
        </div>
      </div>

      <aside className="stack gap-6">
        <div className="card">
          <div className="row gap-2">
            <span className="c-success"><Icon name="lock" /></span>
            <h2 className="t-h2">Your privacy</h2>
          </div>
          <p className="t-small c-secondary">We never ask for your name, email or student ID. Your profile is processed in memory and discarded when the session ends.</p>
          <p className="t-caption c-success">Aligned with Australian Privacy Principles 3 &amp; 6.</p>
        </div>
        <div className="card">
          <h2 className="t-h2">How it works</h2>
          <ol className="t-small stack gap-3" style={{ margin: 0, paddingLeft: 20 }}>
            <li>Pick a major and completed units</li>
            <li>We check every prerequisite rule</li>
            <li>You get a semester plan with reasons</li>
            <li>Ask the syllabus for policy details</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

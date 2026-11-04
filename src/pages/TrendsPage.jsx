import { useState } from 'react';
import { api } from '../api/client.js';
import { useRequest } from '../state/useRequest.js';
import { useAppState } from '../state/AppState.jsx';
import Banner from '../components/Banner.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import { CitationChip } from '../components/Chips.jsx';
import { SystemError } from '../components/States.jsx';

// Figma S5 · Major trends
export default function TrendsPage() {
  const req = useRequest(() => api.getTrends(), []);
  const { setMajor } = useAppState();
  const [open, setOpen] = useState(null);

  return (
    <div className="stack gap-6">
      <div className="page-header">
        <h1 className="t-display">Major trends</h1>
        <p className="t-body c-secondary">Labour-market signals from approved global reports. Every claim links to its source.</p>
      </div>
      <Banner tone="info" title="Trends describe the job market, not your eligibility">
        Use Pathway to check prerequisites. Trend answers follow the same citation and abstention rules as syllabus answers.
      </Banner>
      {req.error && <SystemError error={req.error} onRetry={req.retry} />}
      {req.loading && <div className="trend-grid">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}</div>}
      {req.data && (
        <div className="trend-grid">
          {req.data.trends.map((t) => (
            <article key={t.major.id} className="card" style={{ gap: 12 }}>
              <div className="row gap-2">
                <span className="c-brand"><Icon name="trend" /></span>
                <h2 className="t-h2">{t.major.name}</h2>
              </div>
              <p className="t-body">{t.summary}</p>
              <div className="row wrap gap-2">
                {t.citations.map((c, i) => (
                  <CitationChip key={c.id} citation={c} index={i + 1} selected={open === c.id} onSelect={() => setOpen(open === c.id ? null : c.id)} />
                ))}
              </div>
              {t.citations.filter((c) => c.id === open).map((c) => (
                <blockquote key={c.id} className="passage" style={{ margin: 0 }}><p className="t-small">“{c.snippet}”</p></blockquote>
              ))}
              <div>
                <Button variant="ghost" as="a" href="#pathway" onClick={() => setMajor(t.major.id)}>See pathway for this major</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

import { api } from '../api/client.js';
import { useRequest } from '../state/useRequest.js';
import { useAppState } from '../state/AppState.jsx';
import Banner from '../components/Banner.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icon.jsx';
import UnitCard from '../components/UnitCard.jsx';
import { CurriculumError, PathwaySkeleton, SystemError } from '../components/States.jsx';

// Figma S2 · Pathway (DAG result)
export default function PathwayPage() {
  const { major, completed } = useAppState();
  const key = [...completed].sort().join(',');
  const req = useRequest(() => api.getPathway(major, [...completed]), [major, key]);
  const d = req.data;

  return (
    <div className="stack gap-6">
      <div className="page-header page-header--actions">
        <div>
          <h1 className="t-display">Recommended pathway</h1>
          <p className="t-body c-secondary">
            {d ? `${d.major.name} major · based on ${completed.size} completed units` : 'Based on your study profile'}
          </p>
        </div>
        <Button variant="secondary" as="a" href="#profile">Edit profile</Button>
        <Button as="a" href="#ask">Ask about this plan</Button>
      </div>

      {req.loading && <PathwaySkeleton />}
      {req.error && (req.error.code === 'CURRICULUM_CYCLE' ? <CurriculumError error={req.error} /> : <SystemError error={req.error} onRetry={req.retry} />)}

      {d && !req.loading && (
        <>
          {d.violations === 0 ? (
            <Banner tone="success" title="Prerequisite check passed · 0 violations">
              Every planned unit has all of its prerequisites placed in an earlier semester.
            </Banner>
          ) : (
            <Banner tone="danger" title={`Prerequisite check failed · ${d.violations} violations`}>
              This plan breaks prerequisite rules and must not be used. Report it to the team.
            </Banner>
          )}

          <div className="semesters">
            {d.semesters.map((s) => (
              <section key={s.index} className="semester" aria-label={s.name}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h2 className="t-label">{s.name}</h2>
                  <span className="t-caption c-secondary">{s.units.length} units · {s.credit_points} cp</span>
                </div>
                {s.units.map((u) => (
                  <UnitCard key={u.code} code={u.code} name={u.name} rank={u.rank} note={`${u.credit_points} cp · ${u.reason || 'prerequisites met'}`} />
                ))}
              </section>
            ))}
            {d.blocked_units.length > 0 && (
              <section className="semester semester--blocked" aria-label="Not eligible yet">
                <div className="row gap-2 c-danger">
                  <Icon name="alert" size={16} />
                  <h2 className="t-label">Not eligible yet</h2>
                </div>
                {d.blocked_units.map((u) => (
                  <div key={u.code} className="stack gap-2">
                    <UnitCard status="blocked" code={u.code} name={u.name}
                      note={u.missing_prereqs.length ? `Blocked: needs ${u.missing_prereqs.join(', ')}` : 'Outside the current plan'} />
                    {u.available_after && <p className="t-caption c-secondary">Becomes available after {u.available_after}.</p>}
                  </div>
                ))}
              </section>
            )}
          </div>
          {d.semesters.length === 0 && d.blocked_units.length === 0 && (
            <Banner tone="success" title="Nothing left to plan">You have completed every required unit for this major.</Banner>
          )}

          <Banner tone="info" title="Why this order?">
            Each unit is a node in a prerequisite graph. A unit is placed only after all of its prerequisites. Inside a semester, #1 unlocks the most later units, so take it first. Blocked units always name what is missing.
          </Banner>
        </>
      )}
    </div>
  );
}

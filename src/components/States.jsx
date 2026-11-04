import Banner from './Banner.jsx';
import Button from './Button.jsx';

const ADVISOR = import.meta.env.VITE_ADVISOR_URL || 'mailto:advisor@example.edu';
export const advisorHref = ADVISOR;

// Figma S6: system error (service down / network). Not the same as an abstention.
export function SystemError({ error, onRetry }) {
  return (
    <div className="stack gap-4">
      <Banner tone="danger" title="Something went wrong on our side">
        {error?.code === 'NETWORK_ERROR' ? error.message : 'The service is not responding.'} Your profile is still here. Try again in a moment.
      </Banner>
      {onRetry && <div><Button onClick={onRetry}>Try again</Button></div>}
    </div>
  );
}

// Figma S6: curriculum data error (Risk 4, cycle detected by the DAG engine).
export function CurriculumError({ error }) {
  const cycle = error?.details?.cycle;
  return (
    <div className="stack gap-4">
      <Banner tone="danger" title="Curriculum data error">
        {cycle ? `A circular prerequisite was found (${cycle.join(' → ')}) in the source data, so no plan was generated.` : error.message}
      </Banner>
      <div><Button variant="secondary" as="a" href={ADVISOR}>Contact an academic advisor</Button></div>
    </div>
  );
}

// Figma S6: loading skeleton for the pathway.
export function PathwaySkeleton() {
  return (
    <div className="stack gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Checking every prerequisite rule</span>
      <div className="skeleton" style={{ width: 320, maxWidth: '100%', height: 16 }} />
      <div className="skeleton" style={{ width: 480, maxWidth: '100%', height: 16 }} />
      <div className="semesters">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 14 }} />)}
      </div>
      <p className="t-caption c-secondary">Checking every prerequisite rule… usually under 3 seconds.</p>
    </div>
  );
}

import Icon from './Icon.jsx';

const NAV = [
  { id: 'profile', label: 'Study profile' },
  { id: 'pathway', label: 'Pathway' },
  { id: 'ask', label: 'Ask the syllabus' },
  { id: 'trends', label: 'Major trends' },
];

// Figma: App/TopBar + App/Sidebar
export default function Shell({ page, children }) {
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#profile">
          <span className="brand__logo t-label" aria-hidden="true">A</span>
          <span className="t-h2">Academic Advising Portal</span>
        </a>
        <span className="privacy-pill t-caption">
          <Icon name="lock" size={14} />
          Session only · no name or student ID stored
        </span>
      </header>
      <nav className="sidebar" aria-label="Main">
        <div className="nav">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="nav-item" aria-current={page === n.id ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </div>
        <div className="sidebar__foot">
          <span className="t-caption c-secondary">v1.1</span>
        </div>
      </nav>
      <main className="main" id="main">{children}</main>
    </div>
  );
}

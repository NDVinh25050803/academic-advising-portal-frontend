import Icon from './Icon.jsx';

// Figma: MajorChip · State = Default | Selected
export function MajorChip({ selected, children, ...rest }) {
  return (
    <button type="button" className="major-chip" aria-pressed={selected} {...rest}>
      {selected && <Icon name="check" size={16} />}
      {children}
    </button>
  );
}

// Figma: CitationChip · State = Default | Selected. Label: [n] document · section · page
export function citationLabel(c, n) {
  return [`[${n}] ${c.doc}`, c.section, c.page != null ? `p.${c.page}` : null].filter(Boolean).join(' · ');
}
export function CitationChip({ citation, index, selected, onSelect }) {
  return (
    <button type="button" className="cite-chip" aria-pressed={!!selected} onClick={() => onSelect?.(citation)}
      aria-label={`Source ${index}: ${[citation.doc, citation.section, citation.page != null ? `page ${citation.page}` : null].filter(Boolean).join(', ')}`}>
      <Icon name="file" size={14} />
      {citationLabel(citation, index)}
    </button>
  );
}

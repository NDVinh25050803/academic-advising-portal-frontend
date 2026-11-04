import Icon from './Icon.jsx';

// Figma: UnitSelect · Checked = true | false. Real checkbox kept for keyboard and screen readers.
export default function UnitSelect({ unit, checked, onToggle }) {
  return (
    <label className="unit-select">
      <input type="checkbox" checked={checked} onChange={() => onToggle(unit.code)} />
      <span className="checkbox"><Icon name="check" size={14} /></span>
      <span className="stack">
        <span className="t-caption c-secondary">{unit.code}</span>
        <span className="t-small">{unit.name}</span>
      </span>
    </label>
  );
}

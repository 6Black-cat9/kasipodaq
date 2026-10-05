import { Link } from 'react-router-dom';
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 9c-12-17-31 1-17 12l17 11 17-11C63 10 44-8 32 9Zm0 0v46m0 0c12 17 31-1 17-12L32 32 15 43C1 54 20 72 32 55ZM9 32c-17 12 1 31 12 17l11-17-11-17C10 1-8 20 9 32Zm0 0h46m0 0c17-12-1-31-12-17L32 32l11 17c11 14 29-5 12-17Z"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
  );
}
export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link
      to="/"
      className={`brand ${light ? 'brand-light' : ''}`}
      aria-label="КӘСІПОДАҚ — басты бет"
    >
      <span className="brand-mark">
        <Ornament />
      </span>
      <span>
        <strong>КӘСІПОДАҚ</strong>
        {!compact && <small>Мектеп кәсіподағы</small>}
      </span>
    </Link>
  );
}

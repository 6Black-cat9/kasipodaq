import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Inbox, AlertCircle, X, LoaderCircle } from 'lucide-react';
import { statuses, formatNumber } from '../utils/format';
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
export function Loading({ label = 'Жүктелуде…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-label={label}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        {[0, 1, 2].map((i) => (
          <div className="skeleton skeleton-card" key={i} />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Inbox size={28} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty-state error-state" role="alert">
      <AlertCircle size={28} />
      <h3>Деректерді жүктеу мүмкін болмады</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Қайта жүктеу
        </button>
      )}
    </div>
  );
}
export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {children || statuses[status] || status}
    </span>
  );
}
export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages < 2) return null;
  return (
    <nav className="pagination" aria-label="Беттер">
      <p>
        {total} жазбаның {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} көрсетілді
      </p>
      <div>
        <button
          className="icon-btn"
          aria-label="Алдыңғы бет"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ArrowLeft size={18} />
        </button>
        <span>
          {page} / {pages}
        </span>
        <button
          className="icon-btn"
          aria-label="Келесі бет"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </nav>
  );
}
export function ConfirmModal({
  open,
  title = 'Жазбаны жою',
  description = 'Бұл жазбаны жоюға сенімдісіз бе?',
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title?: string;
  description?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key === 'Tab') {
        const buttons =
          cancelRef.current?.parentElement?.querySelectorAll<HTMLButtonElement>('button');
        if (buttons?.length) {
          const first = buttons[0],
            last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('keydown', handle);
      previous?.focus();
    };
  }, [open, busy, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!busy) onClose();
          }}
        >
          <motion.section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            className="modal-card"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-btn"
              aria-label="Жабу"
              disabled={busy}
              onClick={onClose}
            >
              <X size={20} />
            </button>
            <span className="empty-icon">
              <AlertCircle size={28} />
            </span>
            <h2 id="confirm-title">{title}</h2>
            <p id="confirm-description">{description}</p>
            <div className="modal-actions">
              <button
                ref={cancelRef}
                className="btn btn-secondary"
                disabled={busy}
                onClick={onClose}
              >
                Бас тарту
              </button>
              <button className="btn btn-danger" disabled={busy} onClick={onConfirm}>
                {busy ? <LoaderCircle className="spin" size={18} /> : null}Жою
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
export function StatCard({
  label,
  value,
  icon,
  change,
}: {
  label: string;
  value: number | string;
  icon?: ReactNode;
  change?: string;
}) {
  return (
    <div className="stat-card">
      {icon && <span className="stat-icon">{icon}</span>}
      <span className="stat-label">{label}</span>
      <strong>{typeof value === 'number' ? formatNumber(value) : value}</strong>
      {change && <span className="stat-change">{change}</span>}
    </div>
  );
}
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-35px' }}
      transition={{ duration: 0.45, delay }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    if (!visible) return;
    const controls = animate(0, value, {
      duration: 0.95,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value, visible, reduced]);
  return <span ref={ref}>{formatNumber(display)}</span>;
}

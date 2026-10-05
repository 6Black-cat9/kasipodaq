import { useState, type ReactNode } from 'react';
import { Download, FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { Badge, ConfirmModal } from '../components/ui';
import { bytes, errorMessage, statuses, type Attachment } from './workspaceTypes';
export function Status({ value }: { value: string }) {
  return <Badge status={value}>{statuses[value] || value}</Badge>;
}
export function Options({ items }: { items: Record<string, string> }) {
  return (
    <>
      {Object.entries(items).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = 'Іздеу...',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="workspace-search">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function DeleteRecord({
  url,
  onDeleted,
  children = 'Жою',
  description = 'Бұл әрекетті кері қайтару мүмкін емес.',
}: {
  url: string;
  onDeleted: () => void;
  children?: ReactNode;
  description?: string;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      await api.delete(url);
      toast.success('Жазба жойылды');
      setOpen(false);
      onDeleted();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button type="button" className="btn btn-danger btn-sm" onClick={() => setOpen(true)}>
        {children}
      </button>
      <ConfirmModal
        open={open}
        title="Бұл жазбаны жоюға сенімдісіз бе?"
        description={description}
        busy={busy}
        onConfirm={() => void remove()}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
export function FileLink({ file }: { file: Attachment }) {
  return (
    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="attachment">
      <span className="attachment-icon">
        <FileText size={22} />
      </span>
      <span>
        <strong>{file.fileName}</strong>
        <small>{bytes(file.fileSize)}</small>
      </span>
      <Download size={18} />
    </a>
  );
}
export function FieldHint({ children }: { children: ReactNode }) {
  return <small className="field-hint">{children}</small>;
}
export function checkFile(file: File | undefined, imageOnly = false) {
  if (!file) return;
  const types = imageOnly
    ? ['image/jpeg', 'image/png']
    : [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
      ];
  if (file.size > 10 * 1024 * 1024) throw new Error('Файл көлемі 10 МБ-тан аспауы керек');
  if (!types.includes(file.type)) throw new Error('Файл пішіміне рұқсат жоқ');
}

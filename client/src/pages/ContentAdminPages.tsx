import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  ImagePlus,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import {
  EmptyState,
  ErrorState,
  FormField,
  Loading,
  PageHeader,
  Pagination,
} from '../components/ui';
import {
  bytes,
  dateInput,
  dateText,
  documentCategories,
  errorMessage,
  personName,
  roles,
  uploadAccept,
  type Account,
  type DocumentRecord,
  type EventRecord,
  type NewsRecord,
  type PageList,
} from './workspaceTypes';
import { checkFile, DeleteRecord, FieldHint, Options, SearchField, Status } from './workspaceUI';
function EditorModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const nodes = panel.current?.querySelectorAll<HTMLElement>(
          'button,input,textarea,select,a[href]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          last.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
      }
    }
    document.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="workspace-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="workspace-modal card"
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="section-title">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Жабу">
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function ManageNewsPage() {
  const [q, setQ] = useState(''),
    [status, setStatus] = useState(''),
    [page, setPage] = useState(1);
  const list = useApi<PageList<NewsRecord>>('/news', { q, status, page, pageSize: 10 });
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="АҚПАРАТТЫҚ ОРТАЛЫҚ"
        title="Жаңалықтарды басқару"
        description="Қауымдастықпен маңызды жаңалықтарды бөлісіңіз."
        actions={
          <Link className="btn btn-primary" to="/admin/news/new">
            <Plus size={18} />
            Жаңалық қосу
          </Link>
        }
      />
      <div className="card">
        <div className="toolbar">
          <SearchField
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Жаңалықтарды іздеу"
          />
          <select
            className="input filter-input"
            value={status}
            aria-label="Жариялау мәртебесі"
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Барлық жаңалық</option>
            <option value="PUBLISHED">Жарияланған</option>
            <option value="DRAFT">Жоба</option>
          </select>
        </div>
        {list.loading ? (
          <Loading />
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !list.data?.items.length ? (
          <EmptyState
            title="Жаңалықтар табылмады"
            action={
              <Link to="/admin/news/new" className="btn btn-primary">
                Жаңалық қосу
              </Link>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Жаңалық</th>
                    <th>Мәртебе</th>
                    <th>Жарияланған күні</th>
                    <th>Автор</th>
                    <th>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="content-cell">
                          <span className="table-thumbnail">
                            {item.image ? <img src={item.image} alt="" /> : <FileText size={22} />}
                          </span>
                          <span>
                            <Link className="record-title" to={`/admin/news/${item.slug}/edit`}>
                              {item.title}
                            </Link>
                            <small>/{item.slug}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        <Status value={item.status} />
                      </td>
                      <td>{dateText(item.publishedAt)}</td>
                      <td>
                        {item.author?.member ? personName(item.author.member) : item.author?.email}
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link
                            className="btn btn-ghost btn-sm"
                            to={`/news/${item.slug}`}
                            aria-label="Жаңалықты көру"
                          >
                            <Eye size={17} />
                          </Link>
                          <Link
                            className="btn btn-secondary btn-sm"
                            to={`/admin/news/${item.slug}/edit`}
                          >
                            Өңдеу
                          </Link>
                          <DeleteRecord url={`/news/${item.id}`} onDeleted={list.reload} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={list.data.total} pageSize={10} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
const newsSchema = z.object({
  title: z.string().trim().min(3, 'Тақырыпты енгізіңіз').max(200),
  slug: z
    .string()
    .trim()
    .min(3, 'Сілтемені енгізіңіз')
    .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, 'Әріптер, сандар және дефис қолданыңыз'),
  shortDescription: z.string().trim().min(10, 'Кемінде 10 таңба енгізіңіз').max(600),
  content: z.string().trim().min(20, 'Кемінде 20 таңба енгізіңіз').max(50000),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  image: z.string(),
  publishedAt: z.string(),
  notify: z.boolean(),
});
type NewsValues = z.infer<typeof newsSchema>;
export function NewsEditorPage() {
  const { slug } = useParams();
  const isNew = !slug;
  const navigate = useNavigate();
  const detail = useApi<NewsRecord>(isNew ? null : `/news/${slug}`);
  const [image, setImage] = useState<File>(),
    [preview, setPreview] = useState('');
  const form = useForm<NewsValues>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      slug: '',
      shortDescription: '',
      content: '',
      status: 'DRAFT',
      image: '',
      publishedAt: '',
      notify: false,
    },
  });
  useEffect(() => {
    if (isNew) {
      form.reset({
        title: '',
        slug: '',
        shortDescription: '',
        content: '',
        status: 'DRAFT',
        image: '',
        publishedAt: '',
        notify: false,
      });
      setPreview('');
      setImage(undefined);
      return;
    }
    if (detail.data) {
      form.reset({
        ...detail.data,
        image: detail.data.image || '',
        publishedAt: detail.data.publishedAt?.slice(0, 16) || '',
        status: detail.data.status as 'DRAFT' | 'PUBLISHED',
        notify: false,
      });
      setPreview(detail.data.image || '');
    }
  }, [detail.data, form, isNew]);
  useEffect(() => {
    if (!image) return;
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  async function submit(values: NewsValues) {
    try {
      let imageUrl = values.image || null;
      if (image) {
        checkFile(image, true);
        const payload = new FormData();
        payload.set('file', image);
        const uploaded = await api.post('/uploads', payload);
        imageUrl = uploaded.data.data.fileUrl;
      }
      const payload = {
        ...values,
        image: imageUrl,
        publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : undefined,
      };
      if (isNew) await api.post('/news', payload);
      else await api.put(`/news/${detail.data?.id}`, payload);
      toast.success(values.status === 'PUBLISHED' ? 'Жаңалық жарияланды' : 'Жоба сақталды');
      navigate('/admin/news');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  if (detail.loading) return <Loading />;
  if (detail.error) return <ErrorState message={detail.error} onRetry={detail.reload} />;
  return (
    <div className="page-stack">
      <PageHeader
        title={isNew ? 'Жаңалық қосу' : 'Жаңалықты өңдеу'}
        description="Тақырып, мәтін және фотосуретті енгізіңіз."
        actions={
          <Link className="btn btn-secondary" to="/admin/news">
            <ArrowLeft size={18} />
            Артқа
          </Link>
        }
      />
      <form className="card form-card" onSubmit={form.handleSubmit(submit)}>
        <FormField label="Тақырып" error={form.formState.errors.title?.message}>
          <input className="input" {...form.register('title')} />
        </FormField>
        <FormField label="Сілтеме (slug)" error={form.formState.errors.slug?.message}>
          <input className="input" placeholder="kasipodaq-zhanalygy" {...form.register('slug')} />
          <FieldHint>Жаңалықтың тұрақты сілтемесі. Әріптер мен дефис қолданыңыз.</FieldHint>
        </FormField>
        <FormField
          label="Қысқаша сипаттама"
          error={form.formState.errors.shortDescription?.message}
        >
          <textarea className="input" rows={3} {...form.register('shortDescription')} />
        </FormField>
        <FormField label="Толық мәтін" error={form.formState.errors.content?.message}>
          <textarea className="input" rows={12} {...form.register('content')} />
        </FormField>
        <FormField label="Мұқаба суреті">
          <div className="image-upload">
            {preview ? (
              <img src={preview} alt="Мұқаба алдын ала көрінісі" />
            ) : (
              <ImagePlus size={34} />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              aria-label="Мұқаба суретін таңдау"
              onChange={(e) => setImage(e.target.files?.[0])}
            />
          </div>
          <FieldHint>JPG немесе PNG · 10 МБ-қа дейін</FieldHint>
        </FormField>
        <div className="form-grid">
          <FormField label="Мәртебе">
            <select className="input" {...form.register('status')}>
              <option value="DRAFT">Жоба</option>
              <option value="PUBLISHED">Жарияланған</option>
            </select>
          </FormField>
          <FormField label="Жарияланған күні (міндетті емес)">
            <input type="datetime-local" className="input" {...form.register('publishedAt')} />
          </FormField>
        </div>
        <label className="checkbox-field">
          <input type="checkbox" {...form.register('notify')} />
          Жарияланған кезде мүшелерге хабарлау
        </label>
        <div className="form-footer">
          <Link className="btn btn-secondary" to="/admin/news">
            Бас тарту
          </Link>
          <button className="btn btn-primary" disabled={form.formState.isSubmitting}>
            <Save size={18} />
            {form.formState.isSubmitting ? 'Сақталуда...' : 'Сақтау'}
          </button>
        </div>
      </form>
    </div>
  );
}
const documentSchema = z.object({
  title: z.string().trim().min(3, 'Атауын енгізіңіз').max(200),
  description: z.string().trim().max(2000, 'Сипаттама тым ұзын'),
  category: z.enum([
    'RULES',
    'RESOLUTIONS',
    'PROTOCOLS',
    'ORDERS',
    'REPORTS',
    'REGULATIONS',
    'OTHER',
  ]),
});
type DocValues = z.infer<typeof documentSchema>;
function DocumentEditor({
  item,
  onSaved,
  onClose,
}: {
  item?: DocumentRecord;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File>();
  const form = useForm<DocValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: item?.title || '',
      description: item?.description || '',
      category: (item?.category || 'RULES') as DocValues['category'],
    },
  });
  async function submit(values: DocValues) {
    if (!item && !file) {
      toast.error('Файл таңдаңыз');
      return;
    }
    try {
      checkFile(file);
      const payload = new FormData();
      Object.entries(values).forEach(([key, value]) => payload.set(key, value));
      if (file) payload.set('file', file);
      if (item) await api.put(`/documents/${item.id}`, payload);
      else await api.post('/documents', payload);
      toast.success(item ? 'Құжат жаңартылды' : 'Құжат жүктелді');
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <EditorModal title={item ? 'Құжатты өңдеу' : 'Құжат жүктеу'} onClose={onClose}>
      <form className="form-card" onSubmit={form.handleSubmit(submit)}>
        <FormField label="Құжат атауы" error={form.formState.errors.title?.message}>
          <input className="input" {...form.register('title')} />
        </FormField>
        <FormField label="Сипаттама" error={form.formState.errors.description?.message}>
          <textarea className="input" rows={3} {...form.register('description')} />
        </FormField>
        <FormField label="Санат">
          <select className="input" {...form.register('category')}>
            <Options items={documentCategories} />
          </select>
        </FormField>
        <FormField label={item ? 'Файлды ауыстыру (міндетті емес)' : 'Файл'}>
          <input
            className="input"
            type="file"
            accept={uploadAccept}
            onChange={(e) => setFile(e.target.files?.[0])}
          />
          {item && <small>Қазіргі файл: {item.fileName}</small>}
          <FieldHint>PDF, DOC, DOCX, XLS, XLSX, JPG, PNG · 10 МБ-қа дейін</FieldHint>
        </FormField>
        <button className="btn btn-primary" disabled={form.formState.isSubmitting}>
          <Upload size={18} />
          {form.formState.isSubmitting ? 'Жүктелуде...' : 'Сақтау'}
        </button>
      </form>
    </EditorModal>
  );
}
export function ManageDocumentsPage() {
  const [q, setQ] = useState(''),
    [category, setCategory] = useState(''),
    [page, setPage] = useState(1),
    [editor, setEditor] = useState<DocumentRecord | 'new' | null>(null);
  const list = useApi<PageList<DocumentRecord>>('/documents', { q, category, page, pageSize: 10 });
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ҚҰЖАТТАР ҚОРЫ"
        title="Құжаттарды басқару"
        description="Ресми құжаттарды қауіпсіз жүктеп, санаттарға бөліңіз."
        actions={
          <button className="btn btn-primary" onClick={() => setEditor('new')}>
            <Upload size={18} />
            Құжат жүктеу
          </button>
        }
      />
      <div className="card">
        <div className="toolbar">
          <SearchField
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Құжаттарды іздеу"
          />
          <select
            className="input filter-input"
            aria-label="Құжат санаты"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Барлық санат</option>
            <Options items={documentCategories} />
          </select>
        </div>
        {list.loading ? (
          <Loading />
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !list.data?.items.length ? (
          <EmptyState
            title="Құжаттар табылмады"
            action={
              <button className="btn btn-primary" onClick={() => setEditor('new')}>
                Құжат жүктеу
              </button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Құжат</th>
                    <th>Санат</th>
                    <th>Көлемі</th>
                    <th>Жүктелген күні</th>
                    <th>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        <small>{item.fileName}</small>
                      </td>
                      <td>{documentCategories[item.category]}</td>
                      <td>{bytes(item.fileSize)}</td>
                      <td>{dateText(item.createdAt)}</td>
                      <td>
                        <div className="table-actions">
                          <a
                            className="btn btn-ghost btn-sm"
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Құжатты көру"
                          >
                            <Eye size={16} />
                          </a>
                          <a
                            className="btn btn-ghost btn-sm"
                            href={`${item.fileUrl}${item.fileUrl.includes('?') ? '&' : '?'}download=1`}
                            aria-label="Құжатты жүктеу"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditor(item)}
                          >
                            Өңдеу
                          </button>
                          <DeleteRecord url={`/documents/${item.id}`} onDeleted={list.reload} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={list.data.total} pageSize={10} onChange={setPage} />
          </>
        )}
      </div>
      {editor && (
        <DocumentEditor
          item={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            list.reload();
          }}
        />
      )}
    </div>
  );
}
const eventSchema = z
  .object({
    title: z.string().trim().min(3, 'Атауын енгізіңіз').max(200),
    description: z.string().trim().min(10, 'Кемінде 10 таңба енгізіңіз').max(10000),
    date: z.string().min(1, 'Күнді таңдаңыз'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Уақытты енгізіңіз'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Уақытты енгізіңіз'),
    location: z.string().trim().min(2, 'Орынды енгізіңіз'),
    organizer: z.string().trim().min(2, 'Ұйымдастырушыны енгізіңіз'),
    status: z.enum(['UPCOMING', 'PAST', 'CANCELLED']),
  })
  .refine((v) => v.endTime > v.startTime, {
    path: ['endTime'],
    message: 'Аяқталу уақыты басталу уақытынан кейін болуы керек',
  });
type EventValues = z.infer<typeof eventSchema>;
function EventEditor({
  item,
  onSaved,
  onClose,
}: {
  item?: EventRecord;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [image, setImage] = useState<File>();
  const form = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: item?.title || '',
      description: item?.description || '',
      date: item ? dateInput(item.date) : '',
      startTime: item?.startTime || '10:00',
      endTime: item?.endTime || '12:00',
      location: item?.location || '',
      organizer: item?.organizer || '',
      status: (item?.status || 'UPCOMING') as EventValues['status'],
    },
  });
  async function submit(values: EventValues) {
    try {
      let imageUrl = item?.image || null;
      if (image) {
        checkFile(image, true);
        const payload = new FormData();
        payload.set('file', image);
        const uploaded = await api.post('/uploads', payload);
        imageUrl = uploaded.data.data.fileUrl;
      }
      const payload = { ...values, date: new Date(values.date).toISOString(), image: imageUrl };
      if (item) await api.put(`/events/${item.id}`, payload);
      else await api.post('/events', payload);
      toast.success(item ? 'Іс-шара жаңартылды' : 'Іс-шара қосылды');
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <EditorModal title={item ? 'Іс-шараны өңдеу' : 'Іс-шара қосу'} onClose={onClose}>
      <form className="form-card" onSubmit={form.handleSubmit(submit)}>
        <FormField label="Атауы" error={form.formState.errors.title?.message}>
          <input className="input" {...form.register('title')} />
        </FormField>
        <FormField label="Сипаттамасы" error={form.formState.errors.description?.message}>
          <textarea className="input" rows={4} {...form.register('description')} />
        </FormField>
        <div className="form-grid">
          <FormField label="Күні" error={form.formState.errors.date?.message}>
            <input className="input" type="date" {...form.register('date')} />
          </FormField>
          <FormField label="Мәртебе">
            <select className="input" {...form.register('status')}>
              <option value="UPCOMING">Алда</option>
              <option value="PAST">Өтті</option>
              <option value="CANCELLED">Болдырылмады</option>
            </select>
          </FormField>
          <FormField label="Басталу уақыты" error={form.formState.errors.startTime?.message}>
            <input className="input" type="time" {...form.register('startTime')} />
          </FormField>
          <FormField label="Аяқталу уақыты" error={form.formState.errors.endTime?.message}>
            <input className="input" type="time" {...form.register('endTime')} />
          </FormField>
          <FormField label="Өтетін орны" error={form.formState.errors.location?.message}>
            <input className="input" {...form.register('location')} />
          </FormField>
          <FormField label="Ұйымдастырушы" error={form.formState.errors.organizer?.message}>
            <input className="input" {...form.register('organizer')} />
          </FormField>
        </div>
        <FormField label="Сурет (міндетті емес)">
          <input
            className="input"
            type="file"
            accept="image/jpeg,image/png"
            onChange={(e) => setImage(e.target.files?.[0])}
          />
          <FieldHint>JPG немесе PNG · 10 МБ-қа дейін</FieldHint>
        </FormField>
        <button className="btn btn-primary" disabled={form.formState.isSubmitting}>
          <Save size={18} />
          {form.formState.isSubmitting ? 'Сақталуда...' : 'Сақтау'}
        </button>
      </form>
    </EditorModal>
  );
}
export function ManageEventsPage() {
  const [q, setQ] = useState(''),
    [status, setStatus] = useState(''),
    [page, setPage] = useState(1),
    [editor, setEditor] = useState<EventRecord | 'new' | null>(null);
  const list = useApi<PageList<EventRecord>>('/events', { q, status, page, pageSize: 10 });
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ҚАУЫМДАСТЫҚ ӨМІРІ"
        title="Іс-шараларды басқару"
        description="Кездесулерді жоспарлап, қатысушыларды қадағалаңыз."
        actions={
          <button className="btn btn-primary" onClick={() => setEditor('new')}>
            <Plus size={18} />
            Іс-шара қосу
          </button>
        }
      />
      <div className="card">
        <div className="toolbar">
          <SearchField
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Іс-шараларды іздеу"
          />
          <select
            className="input filter-input"
            aria-label="Іс-шара мәртебесі"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Барлық іс-шара</option>
            <option value="UPCOMING">Алда</option>
            <option value="PAST">Өтті</option>
            <option value="CANCELLED">Болдырылмады</option>
          </select>
        </div>
        {list.loading ? (
          <Loading />
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !list.data?.items.length ? (
          <EmptyState
            title="Іс-шаралар табылмады"
            action={
              <button className="btn btn-primary" onClick={() => setEditor('new')}>
                Іс-шара қосу
              </button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Іс-шара</th>
                    <th>Күні / уақыты</th>
                    <th>Өтетін орны</th>
                    <th>Қатысушылар</th>
                    <th>Мәртебе</th>
                    <th>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link className="record-title" to={`/events/${item.id}`}>
                          {item.title}
                        </Link>
                        <small>{item.organizer}</small>
                      </td>
                      <td>
                        {dateText(item.date)}
                        <small>
                          {item.startTime}–{item.endTime}
                        </small>
                      </td>
                      <td>{item.location}</td>
                      <td>{item._count?.participants ?? item.participants ?? 0}</td>
                      <td>
                        <Status value={item.status} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditor(item)}
                          >
                            Өңдеу
                          </button>
                          <DeleteRecord url={`/events/${item.id}`} onDeleted={list.reload} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={list.data.total} pageSize={10} onChange={setPage} />
          </>
        )}
      </div>
      {editor && (
        <EventEditor
          item={editor === 'new' ? undefined : editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            list.reload();
          }}
        />
      )}
    </div>
  );
}
const accountSchema = z.object({
  role: z.enum(['ADMIN', 'CHAIRMAN', 'MEMBER']),
  isActive: z.boolean(),
});
function AccountEditor({
  item,
  onClose,
  onSaved,
}: {
  item: Account;
  onClose: () => void;
  onSaved: () => void;
}) {
  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: { role: item.role, isActive: item.isActive },
  });
  async function submit(values: z.infer<typeof accountSchema>) {
    try {
      await api.put(`/users/${item.id}`, values);
      toast.success('Қолданушы рұқсаттары жаңартылды');
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <EditorModal title="Қолданушы рұқсаттары" onClose={onClose}>
      <form className="form-card" onSubmit={form.handleSubmit(submit)}>
        <p>{item.email}</p>
        <FormField label="Рөл">
          <select className="input" {...form.register('role')}>
            <Options items={roles} />
          </select>
        </FormField>
        <label className="checkbox-field">
          <input type="checkbox" {...form.register('isActive')} />
          Аккаунт белсенді
        </label>
        <p className="field-hint">
          Аккаунтты өшіру оның сессияларын тоқтатады. Мәліметтер сақталады.
        </p>
        <button className="btn btn-primary" disabled={form.formState.isSubmitting}>
          <ShieldCheck size={18} />
          {form.formState.isSubmitting ? 'Сақталуда...' : 'Рұқсаттарды сақтау'}
        </button>
      </form>
    </EditorModal>
  );
}
export function UsersPage() {
  const { user } = useAuth();
  const [q, setQ] = useState(''),
    [page, setPage] = useState(1),
    [editor, setEditor] = useState<Account | null>(null);
  const list = useApi<PageList<Account>>('/users', { q, page, pageSize: 10 });
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ЖҮЙЕ ҚАУІПСІЗДІГІ"
        title="Қолданушылар мен рөлдер"
        description="Қолданушылардың жүйеге кіру рұқсаттарын басқарыңыз."
        actions={
          <Link className="btn btn-primary" to="/admin/members/new">
            <Plus size={18} />
            Қолданушы қосу
          </Link>
        }
      />
      <div className="card">
        <div className="toolbar">
          <SearchField
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Email немесе аты-жөні бойынша іздеу"
          />
        </div>
        {list.loading ? (
          <Loading />
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !list.data?.items.length ? (
          <EmptyState title="Қолданушылар табылмады" />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Қолданушы</th>
                    <th>Email</th>
                    <th>Рөл</th>
                    <th>Аккаунт</th>
                    <th>Тіркелген күні</th>
                    <th>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{personName(item.member)}</strong>
                        <small>{item.member?.department}</small>
                      </td>
                      <td>{item.email}</td>
                      <td>{roles[item.role]}</td>
                      <td>
                        <Status value={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>
                      <td>{dateText(item.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={item.id === user?.id}
                          onClick={() => setEditor(item)}
                        >
                          {item.id === user?.id ? 'Сіздің аккаунтыңыз' : 'Рөлді өзгерту'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} total={list.data.total} pageSize={10} onChange={setPage} />
          </>
        )}
      </div>
      <div className="info-banner">
        <ShieldCheck size={20} />
        <p>Өз аккаунтыңыздың рөлін немесе белсенділігін өзгертуге болмайды.</p>
      </div>
      {editor && (
        <AccountEditor
          item={editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            list.reload();
          }}
        />
      )}
    </div>
  );
}
const settingsSchema = z.object({
  organizationName: z.string().trim().min(2, 'Ұйым атауын енгізіңіз').max(150),
  schoolName: z.string().trim().min(2, 'Мектеп атауын енгізіңіз').max(200),
  description: z.string().trim().min(10, 'Кемінде 10 таңба енгізіңіз').max(2000),
  email: z.string().email('Email дұрыс емес'),
  phone: z.string().min(7, 'Телефон дұрыс емес').max(30),
  address: z.string().trim().min(5, 'Мекенжайды енгізіңіз').max(400),
});
type SettingsValues = z.infer<typeof settingsSchema>;
export function SettingsPage() {
  const settings = useApi<SettingsValues>('/settings');
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      organizationName: '',
      schoolName: '',
      description: '',
      email: '',
      phone: '',
      address: '',
    },
  });
  useEffect(() => {
    if (settings.data) form.reset(settings.data);
  }, [settings.data, form]);
  async function submit(values: SettingsValues) {
    try {
      await api.put('/settings', values);
      toast.success('Жүйе баптаулары сақталды');
      settings.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ЖҮЙЕ БАПТАУЛАРЫ"
        title="Ұйым туралы мәліметтер"
        description="Платформада көрсетілетін ұйымның байланыс ақпаратын жаңартыңыз."
      />
      {settings.loading ? (
        <Loading />
      ) : settings.error ? (
        <ErrorState message={settings.error} onRetry={settings.reload} />
      ) : (
        <form className="card form-card" onSubmit={form.handleSubmit(submit)}>
          <h2>
            <Settings2 size={22} />
            Негізгі ақпарат
          </h2>
          <div className="form-grid">
            {(['organizationName', 'schoolName', 'email', 'phone', 'address'] as const).map(
              (key) => (
                <FormField
                  key={key}
                  label={
                    {
                      organizationName: 'Кәсіподақ атауы',
                      schoolName: 'Мектеп атауы',
                      email: 'Байланыс Email',
                      phone: 'Телефон',
                      address: 'Мекенжай',
                    }[key]
                  }
                  error={form.formState.errors[key]?.message}
                >
                  <input
                    className="input"
                    type={key === 'email' ? 'email' : 'text'}
                    {...form.register(key)}
                  />
                </FormField>
              ),
            )}
          </div>
          <FormField label="Кәсіподақ туралы" error={form.formState.errors.description?.message}>
            <textarea className="input" rows={5} {...form.register('description')} />
          </FormField>
          <div className="form-footer">
            <button className="btn btn-primary" disabled={form.formState.isSubmitting}>
              <Save size={18} />
              {form.formState.isSubmitting ? 'Сақталуда...' : 'Баптауларды сақтау'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

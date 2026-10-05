import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  FileText,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
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
  applicationStatuses,
  applicationTypes,
  currency,
  dateText,
  errorMessage,
  personName,
  shortDate,
  uploadAccept,
  type PageList,
  type RequestRecord,
} from './workspaceTypes';
import {
  checkFile,
  DeleteRecord,
  FieldHint,
  FileLink,
  Options,
  SearchField,
  Status,
} from './workspaceUI';
export function ApplicationsPage() {
  const { user } = useAuth();
  const staff = user?.role !== 'MEMBER';
  const base = staff ? '/admin' : '/cabinet';
  const [q, setQ] = useState(''),
    [status, setStatus] = useState(''),
    [type, setType] = useState(''),
    [page, setPage] = useState(1);
  const list = useApi<PageList<RequestRecord>>('/applications', {
    q,
    status,
    type,
    page,
    pageSize: 10,
  });
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ӨТІНІШТЕР ОРТАЛЫҒЫ"
        title={staff ? 'Өтініштер' : 'Менің өтініштерім'}
        description={
          staff
            ? 'Мүшелердің өтініштерін қарап, әр қадамды бақылаңыз.'
            : 'Өтініш беріңіз және оның қаралу барысын қадағалаңыз.'
        }
        actions={
          !staff ? (
            <Link to="/cabinet/applications/new" className="btn btn-primary">
              <Plus size={18} />
              Өтініш беру
            </Link>
          ) : undefined
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
            placeholder="Өтінішті іздеу"
          />
          <select
            className="input filter-input"
            aria-label="Өтініш мәртебесі"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Барлық мәртебе</option>
            <Options items={applicationStatuses} />
          </select>
          <select
            className="input filter-input"
            aria-label="Өтініш түрі"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Барлық түрі</option>
            <Options items={applicationTypes} />
          </select>
        </div>
        {list.loading ? (
          <Loading />
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !list.data?.items.length ? (
          <EmptyState
            title="Өтініштер табылмады"
            description={
              q || status || type
                ? 'Сүзгілерді өзгертіп көріңіз.'
                : 'Алғашқы өтінішіңізді осы жерден бере аласыз.'
            }
            action={
              !staff ? (
                <Link to="/cabinet/applications/new" className="btn btn-primary">
                  Жаңа өтініш
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Өтініш</th>
                    {staff && <th>Мүше</th>}
                    <th>Түрі</th>
                    <th>Күні</th>
                    <th>Сома</th>
                    <th>Мәртебе</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link className="record-title" to={`${base}/applications/${item.id}`}>
                          <strong>{item.title}</strong>
                          <small>№ {String(item.number).padStart(4, '0')}</small>
                        </Link>
                      </td>
                      {staff && (
                        <td>
                          {personName(item.member)}
                          <small>{item.member?.department}</small>
                        </td>
                      )}
                      <td>{applicationTypes[item.type]}</td>
                      <td>{shortDate(item.createdAt)}</td>
                      <td>{currency(item.amount)}</td>
                      <td>
                        <Status value={item.status} />
                      </td>
                      <td>
                        <Link
                          className="btn btn-ghost btn-sm"
                          aria-label={`${item.title} өтінішін көру`}
                          to={`${base}/applications/${item.id}`}
                        >
                          <ArrowRight size={18} />
                        </Link>
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
        <Clock3 size={20} />
        <p>Өтініш мәртебесі өзгерген кезде сізге хабарлама келеді.</p>
      </div>
    </div>
  );
}
const requestSchema = z
  .object({
    type: z.enum(['MATERIAL', 'ONE_TIME', 'SOCIAL', 'OTHER']),
    title: z.string().trim().min(3, 'Тақырып кемінде 3 таңба болсын').max(200, 'Тақырып тым ұзын'),
    description: z
      .string()
      .trim()
      .min(10, 'Кемінде 10 таңба енгізіңіз')
      .max(10000, 'Мәтін тым ұзын'),
    amount: z
      .string()
      .refine((v) => !v || (Number(v) > 0 && Number(v) <= 1000000000), 'Соманы дұрыс енгізіңіз'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'MATERIAL' && !data.amount)
      ctx.addIssue({
        code: 'custom',
        path: ['amount'],
        message: 'Материалдық көмек сомасын енгізіңіз',
      });
  });
type RequestValues = z.infer<typeof requestSchema>;
function RequestForm({
  initial,
  onSuccess,
  endpoint,
  method = 'post',
}: {
  initial?: RequestRecord;
  onSuccess: (id: string) => void;
  endpoint: string;
  method?: 'post' | 'put';
}) {
  const [file, setFile] = useState<File>();
  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      type: (initial?.type || 'MATERIAL') as RequestValues['type'],
      title: initial?.title || '',
      description: initial?.description || '',
      amount: initial?.amount?.toString() || '',
    },
  });
  const type = form.watch('type');
  async function submit(values: RequestValues) {
    try {
      checkFile(file);
      const payload = new FormData();
      payload.set('type', values.type);
      payload.set('title', values.title);
      payload.set('description', values.description);
      if (values.amount) payload.set('amount', values.amount);
      if (file) payload.set('file', file);
      const result =
        method === 'post'
          ? await api.post(endpoint, payload)
          : await api.put(endpoint, {
              ...values,
              amount: values.amount ? Number(values.amount) : null,
            });
      toast.success(initial ? 'Өтініш жаңартылды' : 'Өтінішіңіз қабылданды');
      onSuccess(result.data.data.id);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <form onSubmit={form.handleSubmit(submit)} className="card form-card">
      <h2>
        <FileText size={22} />
        {initial ? 'Өтініш мәліметтерін өзгерту' : 'Өтініш туралы мәлімет'}
      </h2>
      <div className="form-grid">
        <FormField label="Өтініш түрі" error={form.formState.errors.type?.message}>
          <select className="input" {...form.register('type')}>
            <Options items={applicationTypes} />
          </select>
        </FormField>
        {type === 'MATERIAL' && (
          <FormField label="Сома (₸)" error={form.formState.errors.amount?.message}>
            <input
              type="number"
              min="1"
              step="0.01"
              className="input"
              placeholder="0"
              {...form.register('amount')}
            />
          </FormField>
        )}
      </div>
      <FormField label="Тақырып" error={form.formState.errors.title?.message}>
        <input
          className="input"
          placeholder="Өтініштің қысқаша тақырыбы"
          {...form.register('title')}
        />
      </FormField>
      <FormField label="Толық мәтін" error={form.formState.errors.description?.message}>
        <textarea
          className="input"
          rows={7}
          placeholder="Өтінішіңіздің себебі мен қажетті ақпаратты жазыңыз"
          {...form.register('description')}
        />
      </FormField>
      {!initial && (
        <FormField label="Қосымша құжат (міндетті емес)">
          <div className="upload-box">
            <Paperclip size={24} />
            <input
              type="file"
              accept={uploadAccept}
              aria-label="Құжатты тіркеу"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </div>
          <FieldHint>PDF, DOC, DOCX, XLS, XLSX, JPG, PNG · 10 МБ-қа дейін</FieldHint>
        </FormField>
      )}
      <div className="form-footer">
        <small>Берілген ақпаратты тек кәсіподақ әкімшілігі көреді.</small>
        <button className="btn btn-primary" disabled={form.formState.isSubmitting}>
          <Send size={18} />
          {form.formState.isSubmitting
            ? 'Жіберілуде...'
            : initial
              ? 'Өзгерістерді сақтау'
              : 'Өтінішті жіберу'}
        </button>
      </div>
    </form>
  );
}
export function NewApplicationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  if (user?.member?.status !== 'ACTIVE')
    return (
      <div className="page-stack">
        <PageHeader title="Жаңа өтініш беру" />
        <EmptyState
          title="Мүшелігіңіз белсенді емес"
          description="Өтініш беру үшін кәсіподақ әкімшілігіне хабарласып, мүшелігіңізді белсендіріңіз."
          action={
            <Link to="/cabinet/profile" className="btn btn-secondary">
              Профильді көру
            </Link>
          }
        />
      </div>
    );
  return (
    <div className="page-stack">
      <PageHeader
        title="Жаңа өтініш беру"
        description="Қажетті мәліметтерді толтырыңыз. Біз сіздің өтінішіңізді қараймыз."
        actions={
          <Link className="btn btn-secondary" to="/cabinet/applications">
            <ArrowLeft size={18} />
            Артқа
          </Link>
        }
      />
      <RequestForm
        endpoint="/applications"
        onSuccess={(id) => navigate(`/cabinet/applications/${id}`)}
      />
    </div>
  );
}
const commentSchema = z.object({
  text: z.string().trim().min(1, 'Жауап мәтінін енгізіңіз').max(5000, 'Жауап тым ұзын'),
});
const statusSchema = z.object({
  status: z.enum(['NEW', 'IN_REVIEW', 'NEEDS_INFO', 'APPROVED', 'REJECTED', 'COMPLETED']),
  comment: z.string().max(5000, 'Жауап тым ұзын'),
});
export function ApplicationDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const staff = user?.role !== 'MEMBER';
  const base = staff ? '/admin' : '/cabinet';
  const navigate = useNavigate();
  const record = useApi<RequestRecord>(`/applications/${id}`);
  const [editing, setEditing] = useState(false),
    [uploadBusy, setUploadBusy] = useState(false);
  const comment = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: '' },
  });
  const status = useForm<z.infer<typeof statusSchema>>({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: 'IN_REVIEW', comment: '' },
  });
  async function addComment(values: z.infer<typeof commentSchema>) {
    try {
      await api.post(`/applications/${id}/comments`, values);
      toast.success('Жауап қосылды');
      comment.reset();
      record.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function changeStatus(values: z.infer<typeof statusSchema>) {
    try {
      await api.post(`/applications/${id}/status`, {
        ...values,
        comment: values.comment.trim() || undefined,
      });
      toast.success('Өтініш мәртебесі өзгертілді');
      status.reset({ ...values, comment: '' });
      record.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploadBusy(true);
    try {
      checkFile(file);
      const payload = new FormData();
      payload.set('file', file);
      await api.post(`/applications/${id}/attachments`, payload);
      toast.success('Файл тіркелді');
      record.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploadBusy(false);
    }
  }
  if (record.loading) return <Loading />;
  if (record.error) return <ErrorState message={record.error} onRetry={record.reload} />;
  if (!record.data) return null;
  const item = record.data;
  const editable =
    staff || (user?.member?.status === 'ACTIVE' && ['NEW', 'NEEDS_INFO'].includes(item.status));
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`ӨТІНІШ № ${String(item.number).padStart(4, '0')}`}
        title={item.title}
        description={`${applicationTypes[item.type]} · ${dateText(item.createdAt)}`}
        actions={
          <Link className="btn btn-secondary" to={`${base}/applications`}>
            <ArrowLeft size={18} />
            Өтініштерге
          </Link>
        }
      />
      <div className="request-layout">
        <div className="page-stack">
          <article className="card request-body">
            <div className="request-topline">
              <Status value={item.status} />
              <span className="amount">{currency(item.amount)}</span>
            </div>
            <h2>Өтініш мәтіні</h2>
            <p className="preserve-lines">{item.description}</p>
            {staff && (
              <div className="request-member">
                <strong>{personName(item.member)}</strong>
                <p>
                  {item.member?.position} · {item.member?.department}
                </p>
                <small>
                  {item.member?.phone} · {item.member?.user?.email}
                </small>
              </div>
            )}
            {editable && (
              <div className="table-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}>
                  {editing ? 'Өңдеуді жабу' : 'Өтінішті өңдеу'}
                </button>
                {user?.role === 'ADMIN' && (
                  <DeleteRecord
                    url={`/applications/${id}`}
                    onDeleted={() => navigate(`${base}/applications`)}
                    description="Өтініш, оның жауаптары және тарихы жойылады."
                  />
                )}
              </div>
            )}
          </article>
          {editing && (
            <RequestForm
              key={item.updatedAt}
              initial={item}
              endpoint={`/applications/${id}`}
              method="put"
              onSuccess={() => {
                setEditing(false);
                record.reload();
              }}
            />
          )}
          <section className="card">
            <h2>
              <Paperclip size={21} />
              Тіркелген файлдар
            </h2>
            {item.attachments?.length ? (
              <div className="attachment-list">
                {item.attachments.map((file) => (
                  <FileLink key={file.id} file={file} />
                ))}
              </div>
            ) : (
              <p className="muted">Қосымша файл тіркелмеген.</p>
            )}
            {editable && (staff || user?.member?.status === 'ACTIVE') && (
              <label className="btn btn-secondary upload-button">
                <Paperclip size={17} />
                {uploadBusy ? 'Жүктелуде...' : 'Файл тіркеу'}
                <input
                  type="file"
                  disabled={uploadBusy}
                  accept={uploadAccept}
                  onChange={(e) => {
                    void upload(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
            <FieldHint>Рұқсат етілген құжаттар мен суреттер · 10 МБ-қа дейін</FieldHint>
          </section>
          <section className="card">
            <h2>
              <MessageSquare size={21} />
              Жауаптар мен пікірлер
            </h2>
            {item.comments?.length ? (
              <div className="comment-list">
                {item.comments.map((entry) => (
                  <article key={entry.id} className="comment">
                    <div>
                      <strong>
                        {entry.user?.member
                          ? personName(entry.user.member)
                          : entry.user?.role === 'MEMBER'
                            ? 'Мүше'
                            : 'Кәсіподақ әкімшілігі'}
                      </strong>
                      <small>{dateText(entry.createdAt)}</small>
                    </div>
                    <p className="preserve-lines">{entry.text}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Әзірге жауаптар жоқ.</p>
            )}
            <form className="comment-form" onSubmit={comment.handleSubmit(addComment)}>
              <FormField label="Жауап жазу" error={comment.formState.errors.text?.message}>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Жауабыңызды жазыңыз..."
                  {...comment.register('text')}
                />
              </FormField>
              <button className="btn btn-primary" disabled={comment.formState.isSubmitting}>
                <Send size={17} />
                {comment.formState.isSubmitting ? 'Жіберілуде...' : 'Жауап жіберу'}
              </button>
            </form>
          </section>
        </div>
        <aside className="page-stack">
          {staff && (
            <form className="card" onSubmit={status.handleSubmit(changeStatus)}>
              <h2>Мәртебені өзгерту</h2>
              <FormField label="Жаңа мәртебе" error={status.formState.errors.status?.message}>
                <select className="input" {...status.register('status')}>
                  <Options items={applicationStatuses} />
                </select>
              </FormField>
              <FormField
                label="Мүшеге жауап (міндетті емес)"
                error={status.formState.errors.comment?.message}
              >
                <textarea className="input" rows={4} {...status.register('comment')} />
              </FormField>
              <button
                className="btn btn-primary full-width"
                disabled={status.formState.isSubmitting}
              >
                {status.formState.isSubmitting ? 'Сақталуда...' : 'Мәртебені жаңарту'}
              </button>
            </form>
          )}
          <section className="card">
            <h2>
              <Clock3 size={21} />
              Өтініш тарихы
            </h2>
            <div className="timeline">
              {item.history?.map((entry) => (
                <div key={entry.id} className="timeline-item">
                  <i />
                  <div>
                    <Status value={entry.newStatus} />
                    <small>{dateText(entry.createdAt)}</small>
                    <p>
                      {entry.user?.member
                        ? personName(entry.user.member)
                        : entry.user?.role === 'MEMBER'
                          ? 'Мүше'
                          : 'Кәсіподақ әкімшілігі'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

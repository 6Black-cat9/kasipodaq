import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, Mail, Phone, Plus, Save, UserRound, Users } from 'lucide-react';
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
  dateInput,
  dateText,
  errorMessage,
  personName,
  type PageList,
  type Person,
} from './workspaceTypes';
import { checkFile, DeleteRecord, FieldHint, SearchField, Status } from './workspaceUI';
export function MembersPage() {
  const { user } = useAuth();
  const [q, setQ] = useState(''),
    [department, setDepartment] = useState(''),
    [position, setPosition] = useState(''),
    [status, setStatus] = useState(''),
    [page, setPage] = useState(1);
  const list = useApi<PageList<Person>>('/members', {
    q,
    department,
    position,
    status,
    page,
    pageSize: 10,
  });
  const admin = user?.role === 'ADMIN';
  function filter(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="КӘСІПОДАҚ ҚАУЫМДАСТЫҒЫ"
        title="Кәсіподақ мүшелері"
        description="Әріптестер туралы мәлімет және мүшелік мәртебесі."
        actions={
          admin ? (
            <Link className="btn btn-primary" to="/admin/members/new">
              <Plus size={18} />
              Мүше қосу
            </Link>
          ) : undefined
        }
      />
      <div className="card">
        <div className="toolbar">
          <SearchField
            value={q}
            onChange={(v) => filter(setQ, v)}
            placeholder="Аты-жөні бойынша іздеу"
          />
          <input
            className="input filter-input"
            aria-label="Бөлім бойынша сүзгі"
            placeholder="Бөлім"
            value={department}
            onChange={(e) => filter(setDepartment, e.target.value)}
          />
          <input
            className="input filter-input"
            aria-label="Қызмет бойынша сүзгі"
            placeholder="Қызмет"
            value={position}
            onChange={(e) => filter(setPosition, e.target.value)}
          />
          <select
            className="input filter-input"
            aria-label="Мүшелік мәртебесі"
            value={status}
            onChange={(e) => filter(setStatus, e.target.value)}
          >
            <option value="">Барлық мәртебе</option>
            <option value="ACTIVE">Белсенді</option>
            <option value="INACTIVE">Белсенді емес</option>
          </select>
        </div>
        {list.loading ? (
          <Loading />
        ) : list.error ? (
          <ErrorState message={list.error} onRetry={list.reload} />
        ) : !list.data?.items.length ? (
          <EmptyState
            title="Мүшелер табылмады"
            description="Іздеу сөзін немесе сүзгілерді өзгертіп көріңіз."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Мүше</th>
                    <th>Қызметі / бөлімі</th>
                    <th>Байланыс</th>
                    <th>Кірген күні</th>
                    <th>Мәртебе</th>
                    <th>Әрекет</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <Link to={`/admin/members/${member.id}`} className="person-cell">
                          <span className="avatar">
                            {member.avatar ? (
                              <img src={member.avatar} alt="" />
                            ) : (
                              <UserRound size={20} />
                            )}
                          </span>
                          <span>
                            <strong>{personName(member)}</strong>
                            <small>#{member.id.slice(-6).toUpperCase()}</small>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <strong>{member.position}</strong>
                        <small>{member.department}</small>
                      </td>
                      <td>
                        <a href={`tel:${member.phone}`}>{member.phone}</a>
                        <small>{member.user?.email}</small>
                      </td>
                      <td>{dateText(member.joinDate)}</td>
                      <td>
                        <Status value={member.status} />
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link className="btn btn-ghost btn-sm" to={`/admin/members/${member.id}`}>
                            {admin ? 'Өңдеу' : 'Көру'}
                          </Link>
                          {admin && (
                            <DeleteRecord
                              url={`/members/${member.id}`}
                              onDeleted={list.reload}
                              description="Мүше және оның аккаунты жойылады. Өтініштері бар мүшені жоюға болмайды."
                            />
                          )}
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
      <div className="info-banner">
        <Users size={20} />
        <p>Жеке байланыс деректері тек кәсіподақ әкімшілігіне қолжетімді.</p>
      </div>
    </div>
  );
}
const memberSchema = z.object({
  firstName: z.string().trim().min(2, 'Кемінде 2 әріп енгізіңіз').max(80, 'Ең көбі 80 таңба'),
  lastName: z.string().trim().min(2, 'Кемінде 2 әріп енгізіңіз').max(80, 'Ең көбі 80 таңба'),
  middleName: z.string().trim().max(80, 'Ең көбі 80 таңба'),
  phone: z.string().trim().min(7, 'Телефон нөмірін дұрыс енгізіңіз').max(30, 'Ең көбі 30 таңба'),
  position: z.string().trim().min(2, 'Қызметті енгізіңіз').max(120, 'Ең көбі 120 таңба'),
  department: z.string().trim().min(2, 'Бөлімді енгізіңіз').max(120, 'Ең көбі 120 таңба'),
  joinDate: z.string().min(1, 'Күнді таңдаңыз'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  email: z.string().email('Email дұрыс емес'),
  password: z.string().refine(value => new TextEncoder().encode(value).length <= 72, 'Құпиясөз 72 байттан аспасын'),
  avatar: z.string(),
});
type MemberValues = z.infer<typeof memberSchema>;
export function MemberEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { user } = useAuth();
  const admin = user?.role === 'ADMIN';
  const navigate = useNavigate();
  const detail = useApi<Person>(isNew ? null : `/members/${id}`);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const form = useForm<MemberValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      phone: '',
      position: '',
      department: '',
      joinDate: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
      email: '',
      password: '',
      avatar: '',
    },
  });
  useEffect(() => {
    if (isNew) {
      form.reset({
        firstName: '',
        lastName: '',
        middleName: '',
        phone: '',
        position: '',
        department: '',
        joinDate: new Date().toISOString().slice(0, 10),
        status: 'ACTIVE',
        email: '',
        password: '',
        avatar: '',
      });
      return;
    }
    if (detail.data)
      form.reset({
        ...detail.data,
        middleName: detail.data.middleName || '',
        avatar: detail.data.avatar || '',
        email: detail.data.user?.email || '',
        joinDate: dateInput(detail.data.joinDate),
        status: detail.data.status as 'ACTIVE' | 'INACTIVE',
        password: '',
      });
  }, [detail.data, form, isNew]);
  async function uploadAvatar(file?: File) {
    if (!file) return;
    setAvatarBusy(true);
    try {
      checkFile(file, true);
      const payload = new FormData();
      payload.set('file', file);
      const response = await api.post('/uploads', payload);
      form.setValue('avatar', response.data.data.fileUrl, { shouldDirty: true });
      toast.success('Сурет жүктелді');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setAvatarBusy(false);
    }
  }
  async function submit(values: MemberValues) {
    if (isNew && values.password.length < 8) {
      form.setError('password', { message: 'Құпиясөз кемінде 8 таңбадан тұруы керек' });
      return;
    }
    if (!isNew && values.password && values.password.length < 8) {
      form.setError('password', { message: 'Құпиясөз кемінде 8 таңбадан тұруы керек' });
      return;
    }
    try {
      const payload = {
        ...values,
        joinDate: new Date(values.joinDate).toISOString(),
        password: values.password || undefined,
        avatar: values.avatar || null,
        middleName: values.middleName || null,
      };
      const response = isNew
        ? await api.post('/members', payload)
        : await api.put(`/members/${id}`, payload);
      toast.success(isNew ? 'Жаңа мүше қосылды' : 'Мәліметтер жаңартылды');
      navigate(`/admin/members/${response.data.data.id}`);
      detail.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  if (detail.loading) return <Loading />;
  if (detail.error) return <ErrorState message={detail.error} onRetry={detail.reload} />;
  if (!admin && detail.data)
    return (
      <div className="page-stack">
        <PageHeader
          title={personName(detail.data)}
          description={detail.data.position}
          actions={
            <Link to="/admin/members" className="btn btn-secondary">
              <ArrowLeft size={18} />
              Мүшелерге оралу
            </Link>
          }
        />
        <div className="card profile-card">
          <span className="avatar avatar-large">
            <UserRound size={36} />
          </span>
          <div>
            <h2>{personName(detail.data)}</h2>
            <p>{detail.data.department}</p>
            <Status value={detail.data.status} />
          </div>
        </div>
        <div className="card detail-grid">
          <div>
            <small>Телефон</small>
            <p>
              <Phone size={16} />
              {detail.data.phone}
            </p>
          </div>
          <div>
            <small>Email</small>
            <p>
              <Mail size={16} />
              {detail.data.user?.email}
            </p>
          </div>
          <div>
            <small>Кәсіподаққа кірген күн</small>
            <p>{dateText(detail.data.joinDate)}</p>
          </div>
        </div>
      </div>
    );
  return (
    <div className="page-stack">
      <PageHeader
        title={isNew ? 'Жаңа мүше қосу' : 'Мүшені өңдеу'}
        description="Жеке мәліметтер мен кәсіподақ мүшелігін басқарыңыз."
        actions={
          <Link className="btn btn-secondary" to="/admin/members">
            <ArrowLeft size={18} />
            Артқа
          </Link>
        }
      />
      <form className="card form-card" onSubmit={form.handleSubmit(submit)}>
        <h2>
          <UserRound size={21} />
          Жеке мәліметтер
        </h2>
        <div className="form-grid">
          {(
            ['lastName', 'firstName', 'middleName', 'phone', 'position', 'department'] as const
          ).map((key) => (
            <FormField
              key={key}
              label={
                {
                  lastName: 'Тегі',
                  firstName: 'Аты',
                  middleName: 'Әкесінің аты',
                  phone: 'Телефон',
                  position: 'Қызметі',
                  department: 'Бөлімі',
                }[key]
              }
              error={form.formState.errors[key]?.message}
            >
              <input className="input" {...form.register(key)} />
            </FormField>
          ))}
          <FormField label="Кәсіподаққа кірген күн" error={form.formState.errors.joinDate?.message}>
            <input type="date" className="input" {...form.register('joinDate')} />
          </FormField>
          <FormField label="Мәртебе">
            <select className="input" {...form.register('status')}>
              <option value="ACTIVE">Белсенді</option>
              <option value="INACTIVE">Белсенді емес</option>
            </select>
          </FormField>
        </div>
        <h2>
          <Check size={21} />
          Аккаунт
        </h2>
        <div className="form-grid">
          <FormField label="Email" error={form.formState.errors.email?.message}>
            <input
              type="email"
              autoComplete="email"
              className="input"
              {...form.register('email')}
            />
          </FormField>
          <FormField
            label={isNew ? 'Құпиясөз' : 'Жаңа құпиясөз (міндетті емес)'}
            error={form.formState.errors.password?.message}
          >
            <input
              type="password"
              autoComplete="new-password"
              className="input"
              {...form.register('password')}
            />
          </FormField>
          <FormField label="Профиль суреті">
            <input
              className="input"
              type="file"
              accept="image/jpeg,image/png"
              disabled={avatarBusy}
              onChange={(e) => void uploadAvatar(e.target.files?.[0])}
            />
            <FieldHint>{avatarBusy ? 'Жүктелуде...' : 'JPG немесе PNG · 10 МБ-қа дейін'}</FieldHint>
          </FormField>
        </div>
        <div className="form-footer">
          <Link className="btn btn-secondary" to="/admin/members">
            Бас тарту
          </Link>
          <button className="btn btn-primary" disabled={form.formState.isSubmitting || avatarBusy}>
            <Save size={18} />
            {form.formState.isSubmitting ? 'Сақталуда...' : 'Сақтау'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  LockKeyhole,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { formatDate } from '../utils/format';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, FormField, Loading, PageHeader, StatCard } from '../components/ui';
import {
  dateText,
  errorMessage,
  personName,
  type EventRecord,
  type NewsRecord,
  type PageList,
  type Person,
  type RequestRecord,
} from './workspaceTypes';
import { checkFile, FieldHint, Status } from './workspaceUI';
export interface Overview {
  members: number;
  activeMembers: number;
  activeApplications: number;
  approvedApplications: number;
  news: number;
  documents: number;
  events: number;
  memberTrend: { name: string; value: number }[];
  applicationTrend: { name: string; total: number; approved: number }[];
  applicationTypes: { name: string; value: number }[];
  applicationStatuses: { name: string; value: number }[];
  eventTrend: { name: string; value: number }[];
}
export function DashboardPage() {
  const { user } = useAuth();
  const staff = user?.role !== 'MEMBER';
  const overview = useApi<Overview>(staff ? '/statistics/overview' : '/public/overview');
  const applications = useApi<PageList<RequestRecord>>('/applications', { pageSize: 5 });
  const members = useApi<PageList<Person>>(staff ? '/members' : null, { pageSize: 4 });
  const events = useApi<PageList<EventRecord>>('/events', { status: 'UPCOMING', pageSize: 3 });
  const news = useApi<PageList<NewsRecord>>('/news', { status: 'PUBLISHED', pageSize: 2 });
  const base = staff ? '/admin' : '/cabinet';
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={staff ? 'БАСҚАРУ ОРТАЛЫҒЫ' : 'МЕНІҢ КӘСІПОДАҒЫМ'}
        title={`Қош келдіңіз, ${user?.member?.firstName || 'әріптес'}!`}
        description={
          staff
            ? 'Бүгінгі маңызды ақпарат пен кәсіподақ жұмысының қысқаша шолуы.'
            : 'Сіздің құқығыңыз, қолдауыңыз және ортақ мүмкіндіктеріңіз — бір жерде.'
        }
        actions={
          !staff ? (
            <Link className="btn btn-primary" to="/cabinet/applications/new">
              <Plus size={18} />
              Өтініш беру
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/admin/applications">
              Өтініштерді қарау
              <ArrowRight size={18} />
            </Link>
          )
        }
      />
      {overview.error ? (
        <ErrorState message={overview.error} onRetry={overview.reload} />
      ) : (
        <div className="stat-grid">
          <StatCard
            label="Кәсіподақ мүшелері"
            value={overview.data?.members ?? '—'}
            icon={<Users size={23} />}
          />
          <StatCard
            label="Белсенді өтініштер"
            value={overview.data?.activeApplications ?? '—'}
            icon={<FileText size={23} />}
          />
          <StatCard
            label="Іс-шаралар"
            value={overview.data?.events ?? '—'}
            icon={<CalendarDays size={23} />}
          />
          <StatCard
            label="Құжаттар"
            value={overview.data?.documents ?? '—'}
            icon={<ShieldCheck size={23} />}
          />
        </div>
      )}
      <div className="dashboard-grid">
        <section className="card dashboard-requests">
          <div className="section-title">
            <div>
              <span className="eyebrow">НАЗАРЫҢЫЗДА</span>
              <h2>{staff ? 'Соңғы өтініштер' : 'Менің соңғы өтініштерім'}</h2>
            </div>
            <Link className="text-link" to={`${base}/applications`}>
              Барлығын көру
              <ArrowRight size={16} />
            </Link>
          </div>
          {applications.loading ? (
            <Loading />
          ) : applications.error ? (
            <ErrorState message={applications.error} onRetry={applications.reload} />
          ) : !applications.data?.items.length ? (
            <EmptyState title="Әзірге өтініштер жоқ" />
          ) : (
            <div className="compact-list">
              {applications.data.items.map((item) => (
                <Link key={item.id} className="compact-item" to={`${base}/applications/${item.id}`}>
                  <span className="compact-icon">
                    <FileText size={20} />
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {staff ? `${personName(item.member)} · ` : ''}
                      {dateText(item.createdAt)}
                    </small>
                  </span>
                  <Status value={item.status} />
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="card upcoming-card">
          <div className="section-title">
            <h2>Алдағы іс-шаралар</h2>
            <CalendarDays size={21} />
          </div>
          {events.loading ? (
            <Loading />
          ) : events.error ? (
            <ErrorState message={events.error} onRetry={events.reload} />
          ) : !events.data?.items.length ? (
            <EmptyState title="Алдағы іс-шара жоқ" />
          ) : (
            events.data.items.map((event) => (
              <Link className="upcoming-event" key={event.id} to={`/events/${event.id}`}>
                <div className="event-date">
                  <strong>{new Date(event.date).getDate()}</strong>
                  <span>{formatDate(event.date, { month: 'short' })}</span>
                </div>
                <div>
                  <h3>{event.title}</h3>
                  <p>
                    {event.startTime}–{event.endTime}
                  </p>
                  <small>
                    <MapPin size={13} />
                    {event.location}
                  </small>
                </div>
              </Link>
            ))
          )}
          <Link className="btn btn-secondary full-width" to="/events">
            Іс-шаралар күнтізбесі
            <ArrowRight size={16} />
          </Link>
        </section>
        {staff ? (
          <section className="card">
            <div className="section-title">
              <h2>Жаңа мүшелер</h2>
              <Link className="text-link" to="/admin/members">
                Барлығы
                <ArrowRight size={15} />
              </Link>
            </div>
            {members.loading ? (
              <Loading />
            ) : members.error ? (
              <ErrorState message={members.error} onRetry={members.reload} />
            ) : !members.data?.items.length ? (
              <EmptyState title="Мүшелер табылмады" />
            ) : (
              <div className="compact-list">
                {members.data.items.map((member) => (
                  <Link className="compact-item" key={member.id} to={`/admin/members/${member.id}`}>
                    <span className="avatar">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </span>
                    <span>
                      <strong>{personName(member)}</strong>
                      <small>
                        {member.position} · {member.department}
                      </small>
                    </span>
                    <Status value={member.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="card membership-card">
            <span className="eyebrow">СІЗДІҢ МҮШЕЛІГІҢІЗ</span>
            <h2>Бірлігіміз — біздің күшіміз</h2>
            <p>Кәсіподақ сіздің кәсіби мүддеңізді қорғап, қажетті сәтте қолдау көрсетеді.</p>
            <div>
              <UserRound size={20} />
              <strong>{personName(user?.member)}</strong>
            </div>
            <Link className="btn btn-secondary" to="/cabinet/profile">
              Профильді көру
              <ArrowRight size={16} />
            </Link>
          </section>
        )}
        <section className="card">
          <div className="section-title">
            <h2>Соңғы жаңалықтар</h2>
            <Link className="text-link" to="/news">
              Барлығы
              <ArrowRight size={15} />
            </Link>
          </div>
          {news.loading ? (
            <Loading />
          ) : news.error ? (
            <ErrorState message={news.error} onRetry={news.reload} />
          ) : !news.data?.items.length ? (
            <EmptyState title="Жаңалықтар жоқ" />
          ) : (
            news.data.items.map((item) => (
              <Link className="dashboard-news" key={item.id} to={`/news/${item.slug}`}>
                <span className="dashboard-news-image">
                  {item.image ? <img src={item.image} alt="" /> : <FileText size={28} />}
                </span>
                <span>
                  <small>{dateText(item.publishedAt)}</small>
                  <h3>{item.title}</h3>
                  <p>{item.shortDescription}</p>
                </span>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'Атыңызды енгізіңіз'),
  lastName: z.string().trim().min(2, 'Тегіңізді енгізіңіз'),
  middleName: z.string().trim(),
  phone: z.string().min(7, 'Телефон нөмірін дұрыс енгізіңіз'),
  avatar: z.string(),
});
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Қазіргі құпиясөзді енгізіңіз'),
    newPassword: z
      .string()
      .min(8, 'Кемінде 8 таңба енгізіңіз')
      .refine(
        (value) => new TextEncoder().encode(value).length <= 72,
        'Құпиясөз 72 байттан аспасын',
      ),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Құпиясөздер сәйкес емес',
  });
export function ProfilePage() {
  const { user, refresh } = useAuth();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const profile = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.member?.firstName || '',
      lastName: user?.member?.lastName || '',
      middleName: user?.member?.middleName || '',
      phone: user?.member?.phone || '',
      avatar: user?.member?.avatar || '',
    },
  });
  const password = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  async function uploadAvatar(file?: File) {
    if (!file) return;
    setAvatarBusy(true);
    try {
      checkFile(file, true);
      const payload = new FormData();
      payload.set('file', file);
      const response = await api.post('/uploads', payload);
      profile.setValue('avatar', response.data.data.fileUrl, { shouldDirty: true });
      toast.success('Сурет жүктелді. Өзгерістерді сақтаңыз.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setAvatarBusy(false);
    }
  }
  async function save(values: z.infer<typeof profileSchema>) {
    try {
      await api.patch('/auth/profile', {
        ...values,
        middleName: values.middleName || null,
        avatar: values.avatar || null,
      });
      await refresh();
      toast.success('Профиль жаңартылды');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function changePassword(values: z.infer<typeof passwordSchema>) {
    try {
      await api.post('/auth/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      password.reset();
      await refresh();
      toast.success('Құпиясөз өзгертілді');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ЖЕКЕ КАБИНЕТ"
        title="Менің профилім"
        description="Жеке деректеріңізді және аккаунт қауіпсіздігін басқарыңыз."
      />
      <div className="card profile-card">
        <span className="avatar avatar-large">
          {user?.member?.avatar ? (
            <img src={user.member.avatar} alt="Профиль суреті" />
          ) : (
            <UserRound size={36} />
          )}
        </span>
        <div>
          <h2>{personName(user?.member)}</h2>
          <p>{user?.email}</p>
          <Status value={user?.member?.status || 'ACTIVE'} />
        </div>
        <div className="profile-meta">
          <small>Кәсіподақ мүшесі</small>
          <strong>{dateText(user?.member?.joinDate)}</strong>
          <p>
            {user?.member?.position} · {user?.member?.department}
          </p>
        </div>
      </div>
      <div className="grid-two">
        <form className="card form-card" onSubmit={profile.handleSubmit(save)}>
          <h2>
            <UserRound size={22} />
            Жеке мәліметтер
          </h2>
          <div className="form-grid">
            {(['lastName', 'firstName', 'middleName', 'phone'] as const).map((key) => (
              <FormField
                key={key}
                label={
                  {
                    lastName: 'Тегі',
                    firstName: 'Аты',
                    middleName: 'Әкесінің аты',
                    phone: 'Телефон',
                  }[key]
                }
                error={profile.formState.errors[key]?.message}
              >
                <input className="input" {...profile.register(key)} />
              </FormField>
            ))}
          </div>
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
          <button
            className="btn btn-primary"
            disabled={profile.formState.isSubmitting || avatarBusy}
          >
            <Save size={18} />
            {profile.formState.isSubmitting ? 'Сақталуда...' : 'Өзгерістерді сақтау'}
          </button>
        </form>
        <form className="card form-card" onSubmit={password.handleSubmit(changePassword)}>
          <h2>
            <LockKeyhole size={22} />
            Құпиясөзді өзгерту
          </h2>
          {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((key) => (
            <FormField
              key={key}
              label={
                {
                  currentPassword: 'Қазіргі құпиясөз',
                  newPassword: 'Жаңа құпиясөз',
                  confirmPassword: 'Жаңа құпиясөзді қайталау',
                }[key]
              }
              error={password.formState.errors[key]?.message}
            >
              <input
                type="password"
                autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'}
                className="input"
                {...password.register(key)}
              />
            </FormField>
          ))}
          <button className="btn btn-primary" disabled={password.formState.isSubmitting}>
            {password.formState.isSubmitting ? 'Сақталуда...' : 'Құпиясөзді жаңарту'}
          </button>
        </form>
      </div>
    </div>
  );
}
const colors = ['#08775a', '#c8993e', '#346a82', '#89b8a7', '#bf7272', '#716c95'];
function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card chart-card">
      <h2>{title}</h2>
      <div className="chart-container">{children}</div>
    </section>
  );
}
function NoChart() {
  return (
    <EmptyState title="Бұл кезеңде деректер жоқ" description="Басқа уақыт аралығын таңдаңыз." />
  );
}
export function StatisticsPage() {
  const [days, setDays] = useState(180);
  const stats = useApi<Overview>('/statistics/overview', { days });
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ДЕРЕКТЕР МЕН НӘТИЖЕЛЕР"
        title="Кәсіподақ статистикасы"
        description="Мүшелік, өтініштер және іс-шаралар бойынша нақты көрсеткіштер."
        actions={
          <select
            aria-label="Статистика кезеңі"
            className="input"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value="7">Соңғы 7 күн</option>
            <option value="30">Соңғы 30 күн</option>
            <option value="90">Соңғы 3 ай</option>
            <option value="180">Соңғы 6 ай</option>
            <option value="365">Соңғы 1 жыл</option>
          </select>
        }
      />
      {stats.loading ? (
        <Loading />
      ) : stats.error ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : (
        stats.data && (
          <>
            <div className="stat-grid">
              <StatCard
                label="Жалпы мүшелер"
                value={stats.data.members}
                icon={<Users size={22} />}
              />
              <StatCard
                label="Белсенді мүшелер"
                value={stats.data.activeMembers}
                icon={<UserRound size={22} />}
              />
              <StatCard
                label="Белсенді өтініштер"
                value={stats.data.activeApplications}
                icon={<FileText size={22} />}
              />
              <StatCard
                label="Мақұлданған өтініштер"
                value={stats.data.approvedApplications}
                icon={<CheckCircle2 size={22} />}
              />
            </div>
            <div className="grid-three">
              <StatCard label="Жаңалықтар" value={stats.data.news} />
              <StatCard label="Құжаттар" value={stats.data.documents} />
              <StatCard label="Іс-шаралар" value={stats.data.events} />
            </div>
            <div className="grid-two">
              <ChartCard title="Мүшелердің айлар бойынша өзгеруі">
                {stats.data.memberTrend.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.data.memberTrend}>
                      <defs>
                        <linearGradient id="membersFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#08775a" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#08775a" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        name="Мүшелер"
                        dataKey="value"
                        stroke="#08775a"
                        fill="url(#membersFill)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <NoChart />
                )}
              </ChartCard>
              <ChartCard title="Өтініштер динамикасы">
                {stats.data.applicationTrend.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.data.applicationTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar name="Барлығы" dataKey="total" fill="#08775a" radius={[5, 5, 0, 0]} />
                      <Bar
                        name="Мақұлданған"
                        dataKey="approved"
                        fill="#c8993e"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <NoChart />
                )}
              </ChartCard>
              <ChartCard title="Өтініш түрлері">
                {stats.data.applicationTypes.some((v) => v.value) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.data.applicationTypes}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={95}
                        paddingAngle={4}
                      >
                        {stats.data.applicationTypes.map((v, i) => (
                          <Cell key={v.name} fill={colors[i % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <NoChart />
                )}
              </ChartCard>
              <ChartCard title="Өтініш мәртебелері">
                {stats.data.applicationStatuses.some((v) => v.value) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.data.applicationStatuses}
                      layout="vertical"
                      margin={{ left: 35 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={135} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        name="Өтініш саны"
                        dataKey="value"
                        fill="#08775a"
                        radius={[0, 5, 5, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <NoChart />
                )}
              </ChartCard>
            </div>
            <ChartCard title="Іс-шаралар динамикасы">
              {stats.data.eventTrend.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.data.eventTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      name="Іс-шаралар"
                      type="monotone"
                      dataKey="value"
                      stroke="#c8993e"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <NoChart />
              )}
            </ChartCard>
          </>
        )
      )}
    </div>
  );
}

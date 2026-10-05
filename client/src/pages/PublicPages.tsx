import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Users,
  FilePenLine,
  CalendarDays,
  Files,
  ShieldCheck,
  HeartHandshake,
  Scale,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  Download,
  FileText,
  Eye,
  LockKeyhole,
  Mail,
  EyeOff,
  LoaderCircle,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { api, errorMessage } from '../api/client';
import { Ornament } from '../components/Brand';
import {
  PageHeader,
  Loading,
  EmptyState,
  ErrorState,
  Pagination,
  FormField,
  Reveal,
  Badge,
  AnimatedNumber,
} from '../components/ui';
import { formatDate, formatFileSize, documentCategories, memberName } from '../utils/format';
import type { Overview, News, Document, Event, ListResponse } from '../types';
function Breadcrumb({ title, section, to }: { title: string; section?: string; to?: string }) {
  return (
    <nav className="breadcrumbs" aria-label="Бет жолы">
      <Link to="/">Басты бет</Link>
      <ChevronRight size={14} />
      {section && (
        <>
          <Link to={to || '/'}>{section}</Link>
          <ChevronRight size={14} />
        </>
      )}
      <span>{title}</span>
    </nav>
  );
}
function NewsCard({ item, index = 0 }: { item: News; index?: number }) {
  return (
    <Reveal delay={index * 0.06}>
      <article className="news-card">
        <Link to={`/news/${item.slug}`} className="news-image">
          {item.image ? (
            <img src={item.image} alt={item.title} loading="lazy" />
          ) : (
            <div className="image-fallback">
              <Ornament />
            </div>
          )}
          <span className="news-category">Кәсіподақ жаңалықтары</span>
          <span className="image-arrow">
            <ArrowUpRight size={19} />
          </span>
        </Link>
        <div className="news-card-body">
          <time dateTime={item.publishedAt || item.createdAt}>
            {formatDate(item.publishedAt || item.createdAt)}
          </time>
          <h3>
            <Link to={`/news/${item.slug}`}>{item.title}</Link>
          </h3>
          <p>{item.shortDescription}</p>
          <Link className="text-link" to={`/news/${item.slug}`}>
            Толығырақ <ArrowRight size={16} />
          </Link>
        </div>
      </article>
    </Reveal>
  );
}
function EventRow({ item }: { item: Event }) {
  const date = new Date(item.date);
  return (
    <Link to={`/events/${item.id}`} className="event-row">
      <div className="event-date">
        <strong>{date.getDate().toString().padStart(2, '0')}</strong>
        <span>{formatDate(item.date, { month: 'short' })}</span>
      </div>
      <div className="event-info">
        <span className="event-type">
          {item.status === 'UPCOMING' ? 'АЛДАҒЫ ІС-ШАРА' : 'ІС-ШАРА'}
        </span>
        <h3>{item.title}</h3>
        <div className="event-meta">
          <span>
            <Clock size={14} />
            {item.startTime} – {item.endTime}
          </span>
          <span>
            <MapPin size={14} />
            {item.location}
          </span>
        </div>
      </div>
      <span className="event-arrow">
        <ArrowUpRight size={22} />
      </span>
    </Link>
  );
}
export function HomePage() {
  const overview = useApi<Overview>('/public/overview');
  const news = useApi<ListResponse<News>>('/news', { pageSize: 3 });
  const events = useApi<ListResponse<Event>>('/events', { status: 'UPCOMING', pageSize: 3 });
  const { user } = useAuth();
  const stats = [
    {
      label: 'Кәсіподақ мүшелері',
      value: overview.data?.members,
      icon: Users,
      foot: 'Бір мақсатқа біріккен ұжым',
    },
    {
      label: 'Белсенді өтініштер',
      value: overview.data?.activeApplications,
      icon: FilePenLine,
      foot: 'Әр өтініш назарымызда',
    },
    {
      label: 'Іс-шаралар',
      value: overview.data?.events,
      icon: CalendarDays,
      foot: 'Бірге өткізген сәттер',
    },
    {
      label: 'Құжаттар',
      value: overview.data?.documents,
      icon: Files,
      foot: 'Қажетті ақпарат бір жерде',
    },
  ];
  return (
    <>
      <section className="home-hero">
        <div className="container hero-grid">
          <Reveal className="hero-copy">
            <span className="hero-eyebrow">
              <span /> МЕКТЕП КӘСІПОДАҒЫ
            </span>
            <h1>
              Күшіміз —<br />
              <span>бірлікте.</span>
              <Ornament className="headline-ornament" />
            </h1>
            <h2>Кәсіподақ — қызметкерлердің құқығы мен мүддесін қорғау орталығы</h2>
            <p>
              Сізге қолдау, ұжымға сенім.
              <br />
              Мектеп өмірін бірге жақсартуға арналған
              <br className="desktop-break" /> ашық әрі ыңғайлы платформа.
            </p>
            <div className="hero-actions">
              <Link to={user ? '/cabinet/applications/new' : '/login'} className="btn btn-primary">
                Өтініш беру <ArrowUpRight size={18} />
              </Link>
              <Link to="/news" className="btn btn-secondary">
                Жаңалықтарды көру <ArrowRight size={17} />
              </Link>
            </div>
            <div className="hero-trust">
              <span className="trust-icon">
                <ShieldCheck size={18} />
              </span>
              <span>Сіздің құқығыңыз. Біздің жауапкершілігіміз.</span>
            </div>
          </Reveal>
          <Reveal className="hero-visual" delay={0.12}>
            <div className="hero-image-wrap">
              <img
                className="hero-image"
                src="/api/assets/hero-community.jpg"
                alt="Мектептің білімді, ұйымшыл ұстаздар ұжымы"
                fetchPriority="high"
              />
              <div className="hero-image-shade" />
              <div className="hero-photo-caption">
                <span className="photo-caption-line" />
                <span>Білімге адал. Бірлікке берік.</span>
              </div>
              <Ornament className="hero-image-ornament" />
            </div>
            <div className="community-badge">
              <span className="community-icon">
                <HeartHandshake size={26} />
              </span>
              <div>
                <strong>Әрқашан жаныңыздамыз</strong>
                <span>Қолдау. Қорғау. Бірлік.</span>
              </div>
              <span className="badge-check">
                <Check size={16} />
              </span>
            </div>
            <div className="hero-decoration">
              <Ornament />
            </div>
          </Reveal>
        </div>
      </section>
      <section className="home-stats container" aria-label="Кәсіподақ сандармен">
        {stats.map((stat, index) => (
          <Reveal key={stat.label} className="home-stat" delay={index * 0.05}>
            <div className="home-stat-top">
              <span>{stat.label}</span>
              <stat.icon size={21} />
            </div>
            <strong>
              {stat.value === undefined ? (
                <span className="skeleton skeleton-number" />
              ) : (
                <AnimatedNumber value={stat.value} />
              )}
              <span className="stat-gold">{index === 0 ? '+' : ''}</span>
            </strong>
            <small>{stat.foot}</small>
          </Reveal>
        ))}
      </section>
      {overview.error && (
        <div className="container">
          <ErrorState message={overview.error} onRetry={overview.reload} />
        </div>
      )}
      <section className="home-news section-space">
        <div className="container">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow">КӘСІПОДАҚ ӨМІРІ</span>
              <h2>
                Соңғы жаңалықтар<span className="heading-dot">.</span>
              </h2>
              <p>Ұжымымыздағы маңызды оқиғалар мен жаңа бастамалар.</p>
            </div>
            <Link to="/news" className="section-link">
              Барлық жаңалықтар <ArrowUpRight size={18} />
            </Link>
          </Reveal>
          {news.loading ? (
            <Loading />
          ) : news.error ? (
            <ErrorState message={news.error} onRetry={news.reload} />
          ) : news.data?.items.length ? (
            <div className="news-grid">
              {news.data.items.map((item, index) => (
                <NewsCard key={item.id} item={item} index={index} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Жаңалықтар жақында жарияланады"
              description="Кәсіподақтың соңғы жаңалықтарын осы жерден оқыңыз."
            />
          )}
        </div>
      </section>
      <section className="home-events section-space">
        <div className="container events-section-grid">
          <Reveal className="events-intro">
            <span className="eyebrow">БІРГЕ ӨТКІЗЕТІН СӘТТЕР</span>
            <h2>
              Кездесейік.
              <br />
              Қатысайық.
              <br />
              <span>Бірге болайық.</span>
            </h2>
            <p>Ортақ идеялар, пайдалы кездесулер және ұжымдық іс-шаралар.</p>
            <Link to="/events" className="btn btn-secondary">
              Іс-шаралар күнтізбесі <ArrowUpRight size={17} />
            </Link>
            <Ornament className="events-ornament" />
          </Reveal>
          <div className="events-list">
            <div className="events-list-head">
              <CalendarDays size={18} />
              <span>Алдағы іс-шаралар</span>
              <span className="live-dot" />
            </div>
            {events.loading ? (
              <Loading />
            ) : events.error ? (
              <ErrorState message={events.error} onRetry={events.reload} />
            ) : events.data?.items.length ? (
              events.data.items.map((item) => <EventRow item={item} key={item.id} />)
            ) : (
              <EmptyState
                title="Алдағы іс-шаралар жоқ"
                description="Жаңа іс-шаралар туралы хабарлаймыз."
              />
            )}
          </div>
        </div>
      </section>
      <section className="section-space" id="about">
        <div className="container">
          <Reveal className="section-heading">
            <div>
              <span className="eyebrow">СІЗ ҮШІН МАҢЫЗДЫ</span>
              <h2>
                Қолдау әр қадамда<span className="heading-dot">.</span>
              </h2>
              <p>Кәсіподақ — қызметкерлердің құқығы мен мүддесін қорғау орталығы.</p>
            </div>
            <Ornament className="section-ornament" />
          </Reveal>
          <div className="support-grid">
            {[
              {
                icon: Scale,
                title: 'Құқығыңызды қорғау',
                text: 'Еңбек құқықтары, ұжымдық келісім және қажетті нормативтік құжаттар.',
                to: '/documents',
                link: 'Құжаттармен танысу',
              },
              {
                icon: HeartHandshake,
                title: 'Әлеуметтік қолдау',
                text: 'Материалдық және әлеуметтік көмекке өтініш беріңіз. Біз әр өтінішке назар аударамыз.',
                to: '/cabinet/applications/new',
                link: 'Өтініш беру',
              },
              {
                icon: Users,
                title: 'Ашық байланыс',
                text: 'Өтінішіңіздің барысын қадағалаңыз, кәсіподақпен тікелей байланыста болыңыз.',
                to: '/cabinet',
                link: 'Жеке кабинетке өту',
              },
            ].map((item, index) => (
              <Reveal className="support-card" key={item.title} delay={index * 0.05}>
                <span className="support-icon">
                  <item.icon size={25} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link className="text-link" to={item.to}>
                  {item.link}
                  <ArrowUpRight size={16} />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="container home-cta-wrap">
        <Reveal className="home-cta">
          <div>
            <span className="eyebrow">ӘР МҮШЕ МАҢЫЗДЫ</span>
            <h2>Сіздің дауысыңыз естіледі.</h2>
            <p>Кәсіподақпен бірге өз мүмкіндіктеріңізді ашыңыз.</p>
          </div>
          <Link
            className="btn btn-gold"
            to={user ? (user.role === 'MEMBER' ? '/cabinet' : '/admin') : '/login'}
          >
            Жеке кабинетке кіру <ArrowUpRight size={19} />
          </Link>
          <Ornament className="cta-ornament" />
        </Reveal>
      </section>
    </>
  );
}
const loginSchema = z.object({
  email: z.string().email('Дұрыс email мекенжайын енгізіңіз'),
  password: z.string().min(1, 'Құпиясөзді енгізіңіз'),
});
type LoginValues = z.infer<typeof loginSchema>;
export function LoginPage() {
  const { login, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  useEffect(() => {
    if (user) navigate(user.role === 'MEMBER' ? '/cabinet' : '/admin', { replace: true });
  }, [user, navigate]);
  async function submit(values: LoginValues) {
    try {
      const next = await login(values.email, values.password);
      const from = (location.state as { from?: string } | null)?.from;
      const allowedFrom = next.role !== 'MEMBER' || !from?.startsWith('/admin');
      navigate(from && allowedFrom ? from : next.role === 'MEMBER' ? '/cabinet' : '/admin', {
        replace: true,
      });
      toast.success('Қош келдіңіз!');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }
  return (
    <div className="login-page">
      <div className="login-visual">
        <img src="/api/assets/hero-community.jpg" alt="Мектеп қызметкерлері" />
        <div className="login-visual-overlay" />
        <div className="login-visual-content">
          <Ornament />
          <span className="eyebrow">КӘСІПОДАҚ — СІЗДІҢ ҚОЛДАУЫҢЫЗ</span>
          <h2>
            Бірге сенімді.
            <br />
            Бірге мықты.
          </h2>
          <p>
            Құқығыңыз қорғалған,
            <br />
            өтінішіңіз назарымызда.
          </p>
        </div>
      </div>
      <section className="login-form-area">
        <Link to="/" className="text-link login-back">
          <ArrowLeft size={17} />
          Басты бетке
        </Link>
        <div className="login-form-box">
          <span className="login-icon">
            <LockKeyhole size={26} />
          </span>
          <span className="eyebrow">ҚОШ КЕЛДІҢІЗ</span>
          <h1>Жеке кабинетке кіру</h1>
          <p>
            Кәсіподақ мүмкіндіктеріне қол жеткізу үшін
            <br />
            тіркелгіңізге кіріңіз.
          </p>
          <form onSubmit={handleSubmit(submit)} noValidate>
            <FormField label="Email мекенжайы" error={errors.email?.message}>
              <div className="input-icon">
                <Mail size={18} />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@school.kz"
                  {...register('email')}
                  aria-invalid={Boolean(errors.email)}
                />
              </div>
            </FormField>
            <FormField label="Құпиясөз" error={errors.password?.message}>
              <div className="input-icon">
                <LockKeyhole size={18} />
                <input
                  type={visible ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Құпиясөзіңізді енгізіңіз"
                  {...register('password')}
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={visible ? 'Құпиясөзді жасыру' : 'Құпиясөзді көрсету'}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </FormField>
            <button className="btn btn-primary login-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? <LoaderCircle size={18} className="spin" /> : null}
              {isSubmitting ? 'Кіруде…' : 'Кіру'}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-help">
            <ShieldCheck size={19} />
            <p>
              Тіркелгіге қатысты сұрақ туындаса,
              <br />
              кәсіподақ әкімшілігіне хабарласыңыз.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
export function NewsPage() {
  const [q, setQ] = useState(''),
    [page, setPage] = useState(1);
  const news = useApi<ListResponse<News>>('/news', { q, page, pageSize: 9 });
  return (
    <div className="container page-section">
      <Breadcrumb title="Жаңалықтар" />
      <PageHeader
        eyebrow="КӘСІПОДАҚ ӨМІРІ"
        title="Жаңалықтар"
        description="Ұжымымыздағы маңызды оқиғалар, пайдалы ақпарат және жаңа бастамалар."
      />
      <div className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Жаңалықтарды іздеу…"
            aria-label="Жаңалықтарды іздеу"
          />
        </label>
        <span className="result-count">{news.data?.total ?? 0} жаңалық</span>
      </div>
      {news.loading ? (
        <Loading />
      ) : news.error ? (
        <ErrorState message={news.error} onRetry={news.reload} />
      ) : news.data?.items.length ? (
        <>
          <div className="news-grid">
            {news.data.items.map((item, index) => (
              <NewsCard item={item} index={index} key={item.id} />
            ))}
          </div>
          <Pagination page={page} total={news.data.total} pageSize={9} onChange={setPage} />
        </>
      ) : (
        <EmptyState title="Жаңалық табылмады" description="Іздеу сөзін өзгертіп көріңіз." />
      )}
    </div>
  );
}
export function NewsDetailPage() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useApi<News>(slug ? `/news/${slug}` : null);
  useEffect(() => {
    if (data) document.title = `${data.title} | КӘСІПОДАҚ`;
    return () => {
      document.title = 'КӘСІПОДАҚ — мектеп кәсіподағы';
    };
  }, [data]);
  if (loading)
    return (
      <div className="container page-section">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="container page-section">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  if (!data) return <ErrorPage />;
  return (
    <article className="container page-section article-page">
      <Breadcrumb section="Жаңалықтар" to="/news" title="Жаңалық" />
      <div className="article-header">
        <span className="eyebrow">КӘСІПОДАҚ ЖАҢАЛЫҚТАРЫ</span>
        <h1>{data.title}</h1>
        <div className="article-meta">
          <time>{formatDate(data.publishedAt || data.createdAt)}</time>
          <span>·</span>
          <span>
            {data.author?.member ? memberName(data.author.member) : 'Кәсіподақ әкімшілігі'}
          </span>
        </div>
        <p className="article-lead">{data.shortDescription}</p>
      </div>
      {data.image && <img className="article-cover" src={data.image} alt={data.title} />}
      <div className="article-content">
        {data.content
          .split('\n')
          .filter(Boolean)
          .map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
      </div>
      <div className="article-bottom">
        <Link className="btn btn-secondary" to="/news">
          <ArrowLeft size={17} />
          Барлық жаңалықтар
        </Link>
      </div>
    </article>
  );
}
export function DocumentsPage() {
  const [q, setQ] = useState(''),
    [category, setCategory] = useState(''),
    [page, setPage] = useState(1);
  const documents = useApi<ListResponse<Document>>('/documents', {
    q,
    category,
    page,
    pageSize: 12,
  });
  return (
    <div className="container page-section">
      <Breadcrumb title="Құжаттар" />
      <PageHeader
        eyebrow="АШЫҚТЫҚ ЖӘНЕ СЕНІМ"
        title="Құжаттар кітапханасы"
        description="Кәсіподақтың ережелері, есептері және қажетті нормативтік құжаттар."
      />
      <div className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Құжатты іздеу…"
            aria-label="Құжатты іздеу"
          />
        </label>
        <select
          className="input filter-select"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Құжат санаты"
        >
          <option value="">Барлық санаттар</option>
          {Object.entries(documentCategories).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {documents.loading ? (
        <Loading />
      ) : documents.error ? (
        <ErrorState message={documents.error} onRetry={documents.reload} />
      ) : documents.data?.items.length ? (
        <>
          <div className="documents-grid">
            {documents.data.items.map((item) => (
              <Reveal key={item.id} className="document-card">
                <div className="document-card-head">
                  <span className="document-file-icon">
                    <FileText size={25} />
                  </span>
                  <span className="document-category">{documentCategories[item.category]}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="document-meta">
                  <span>
                    {item.fileName.split('.').pop()?.toUpperCase()} ·{' '}
                    {formatFileSize(item.fileSize)}
                  </span>
                  <time>
                    {formatDate(item.createdAt, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                </div>
                <div className="document-actions">
                  <a
                    className="btn btn-secondary btn-sm"
                    target="_blank"
                    rel="noreferrer"
                    href={item.fileUrl}
                  >
                    <Eye size={16} />
                    Көру
                  </a>
                  <a className="btn btn-ghost btn-sm" href={`${item.fileUrl}?download=1`}>
                    <Download size={16} />
                    Жүктеу
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
          <Pagination page={page} total={documents.data.total} pageSize={12} onChange={setPage} />
        </>
      ) : (
        <EmptyState title="Құжат табылмады" description="Іздеу сөзін немесе санатты өзгертіңіз." />
      )}
      <div className="info-strip">
        <ShieldCheck size={23} />
        <div>
          <strong>Сенімді және өзекті ақпарат</strong>
          <p>Барлық құжаттар кәсіподақ әкімшілігімен жарияланады.</p>
        </div>
      </div>
    </div>
  );
}
export function EventsPage() {
  const [status, setStatus] = useState('UPCOMING'),
    [page, setPage] = useState(1);
  const events = useApi<ListResponse<Event>>('/events', { status, page, pageSize: 9 });
  return (
    <div className="container page-section">
      <Breadcrumb title="Іс-шаралар" />
      <PageHeader
        eyebrow="БІРГЕ ӨТКІЗЕТІН СӘТТЕР"
        title="Іс-шаралар"
        description="Кездесулерге қосылыңыз, жаңа мүмкіндіктерді ашыңыз және ұжыммен бірге болыңыз."
      />
      <div className="tabs" role="tablist" aria-label="Іс-шаралар кезеңі">
        {[
          { value: 'UPCOMING', label: 'Алдағы іс-шаралар' },
          { value: 'PAST', label: 'Өткен іс-шаралар' },
          { value: 'CANCELLED', label: 'Болдырылмаған' },
        ].map((tab) => (
          <button
            key={tab.value}
            role="tab"
            aria-selected={status === tab.value}
            className={status === tab.value ? 'active' : ''}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {events.loading ? (
        <Loading />
      ) : events.error ? (
        <ErrorState message={events.error} onRetry={events.reload} />
      ) : events.data?.items.length ? (
        <>
          <div className="events-grid">
            {events.data.items.map((item) => (
              <Reveal className="event-card" key={item.id}>
                <Link to={`/events/${item.id}`} className="event-card-image">
                  {item.image ? (
                    <img src={item.image} alt={item.title} loading="lazy" />
                  ) : (
                    <div className="image-fallback">
                      <CalendarDays size={46} />
                    </div>
                  )}
                  <div className="event-card-date">
                    <strong>{new Date(item.date).getDate()}</strong>
                    <span>{formatDate(item.date, { month: 'short' })}</span>
                  </div>
                  <Badge status={item.status} />
                </Link>
                <div className="event-card-body">
                  <h3>
                    <Link to={`/events/${item.id}`}>{item.title}</Link>
                  </h3>
                  <p>{item.description}</p>
                  <div className="event-meta">
                    <span>
                      <Clock size={15} />
                      {item.startTime} – {item.endTime}
                    </span>
                    <span>
                      <MapPin size={15} />
                      {item.location}
                    </span>
                  </div>
                  <Link className="text-link" to={`/events/${item.id}`}>
                    Толығырақ <ArrowUpRight size={17} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          <Pagination page={page} total={events.data.total} pageSize={9} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="Бұл кезеңде іс-шара жоқ"
          description="Жаңа кездесулер туралы ақпарат осы жерде жарияланады."
        />
      )}
    </div>
  );
}
export function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi<Event>(id ? `/events/${id}` : null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function participate() {
    if (!user) {
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    setBusy(true);
    try {
      if (data?.isParticipating) await api.delete(`/events/${id}/participate`);
      else await api.post(`/events/${id}/participate`);
      toast.success(data?.isParticipating ? 'Қатысудан бас тарттыңыз' : 'Іс-шараға тіркелдіңіз');
      reload();
    } catch (reason) {
      toast.error(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="container page-section">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="container page-section">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  if (!data) return <ErrorPage />;
  return (
    <div className="container page-section">
      <Breadcrumb section="Іс-шаралар" to="/events" title="Іс-шара" />
      <div className="event-detail-grid">
        <article>
          <Badge status={data.status} />
          <h1 className="event-detail-title">{data.title}</h1>
          {data.image && <img className="event-detail-cover" src={data.image} alt={data.title} />}
          <div className="article-content">
            {data.description
              .split('\n')
              .filter(Boolean)
              .map((p, index) => (
                <p key={index}>{p}</p>
              ))}
          </div>
          <Link to="/events" className="text-link">
            <ArrowLeft size={17} />
            Барлық іс-шаралар
          </Link>
        </article>
        <aside className="event-details-card card">
          <span className="eyebrow">ІС-ШАРА ТУРАЛЫ</span>
          <div>
            <CalendarDays />
            <span>
              <small>Өтетін күні</small>
              <strong>{formatDate(data.date)}</strong>
            </span>
          </div>
          <div>
            <Clock />
            <span>
              <small>Уақыты</small>
              <strong>
                {data.startTime} – {data.endTime}
              </strong>
            </span>
          </div>
          <div>
            <MapPin />
            <span>
              <small>Өтетін орны</small>
              <strong>{data.location}</strong>
            </span>
          </div>
          <div>
            <Users />
            <span>
              <small>Ұйымдастырушы</small>
              <strong>{data.organizer}</strong>
            </span>
          </div>
          <div>
            <HeartHandshake />
            <span>
              <small>Қатысушылар</small>
              <strong>{data.participants ?? 0} адам</strong>
            </span>
          </div>
          {data.status === 'UPCOMING' && (
            <button
              className={`btn ${data.isParticipating ? 'btn-secondary' : 'btn-primary'}`}
              disabled={busy}
              onClick={() => void participate()}
            >
              {busy ? (
                <LoaderCircle size={18} className="spin" />
              ) : data.isParticipating ? (
                <Check size={18} />
              ) : null}
              {data.isParticipating ? 'Қатысудан бас тарту' : 'Қатысуға тіркелу'}
              <ArrowUpRight size={17} />
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
export function ErrorPage({ code = 404 }: { code?: number }) {
  const texts: Record<number, { title: string; description: string }> = {
    404: {
      title: 'Бет табылмады',
      description: 'Бұл бет көшірілген немесе мекенжайы қате жазылған болуы мүмкін.',
    },
    403: {
      title: 'Қолжетімділік шектелген',
      description: 'Бұл бөлімді көруге сіздің рөліңізге рұқсат берілмеген.',
    },
    500: {
      title: 'Серверде қате орын алды',
      description: 'Бетті қайта жүктеп көріңіз немесе әкімшілікке хабарласыңыз.',
    },
  };
  const text = texts[code] || texts[404];
  return (
    <div className="container error-page">
      <Ornament />
      <strong>{code}</strong>
      <h1>{text.title}</h1>
      <p>{text.description}</p>
      <Link to="/" className="btn btn-primary">
        Басты бетке оралу
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}

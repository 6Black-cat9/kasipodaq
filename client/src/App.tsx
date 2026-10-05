import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { Loading } from './components/ui';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  HomePage,
  LoginPage,
  NewsPage,
  NewsDetailPage,
  DocumentsPage,
  EventsPage,
  EventDetailPage,
  ErrorPage,
} from './pages/PublicPages';
const workspacePages = () => import('./pages/WorkspacePages');
const DashboardPage = lazy(() => workspacePages().then((m) => ({ default: m.DashboardPage })));
const ProfilePage = lazy(() => workspacePages().then((m) => ({ default: m.ProfilePage })));
const StatisticsPage = lazy(() => workspacePages().then((m) => ({ default: m.StatisticsPage })));
const MembersPage = lazy(() => workspacePages().then((m) => ({ default: m.MembersPage })));
const MemberEditorPage = lazy(() =>
  workspacePages().then((m) => ({ default: m.MemberEditorPage })),
);
const ApplicationsPage = lazy(() =>
  workspacePages().then((m) => ({ default: m.ApplicationsPage })),
);
const ApplicationDetailPage = lazy(() =>
  workspacePages().then((m) => ({ default: m.ApplicationDetailPage })),
);
const NewApplicationPage = lazy(() =>
  workspacePages().then((m) => ({ default: m.NewApplicationPage })),
);
const ManageNewsPage = lazy(() => workspacePages().then((m) => ({ default: m.ManageNewsPage })));
const NewsEditorPage = lazy(() => workspacePages().then((m) => ({ default: m.NewsEditorPage })));
const ManageDocumentsPage = lazy(() =>
  workspacePages().then((m) => ({ default: m.ManageDocumentsPage })),
);
const ManageEventsPage = lazy(() =>
  workspacePages().then((m) => ({ default: m.ManageEventsPage })),
);
const UsersPage = lazy(() => workspacePages().then((m) => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => workspacePages().then((m) => ({ default: m.SettingsPage })));
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Suspense
          fallback={
            <div className="container page-section">
              <Loading />
            </div>
          }
        >
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="news/:slug" element={<NewsDetailPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/:id" element={<EventDetailPage />} />
              <Route path="403" element={<ErrorPage code={403} />} />
              <Route path="500" element={<ErrorPage code={500} />} />
              <Route path="*" element={<ErrorPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="cabinet" element={<WorkspaceLayout member />}>
                <Route index element={<DashboardPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="applications/new" element={<NewApplicationPage />} />
                <Route path="applications/:id" element={<ApplicationDetailPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute roles={['ADMIN', 'CHAIRMAN']} />}>
              <Route path="admin" element={<WorkspaceLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="members/:id" element={<MemberEditorPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="applications/:id" element={<ApplicationDetailPage />} />
                <Route path="news" element={<ManageNewsPage />} />
                <Route path="news/new" element={<NewsEditorPage />} />
                <Route path="news/:slug/edit" element={<NewsEditorPage />} />
                <Route path="events" element={<ManageEventsPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                  <Route path="members/new" element={<MemberEditorPage />} />
                  <Route path="documents" element={<ManageDocumentsPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

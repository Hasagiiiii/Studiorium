import { Route, Routes } from 'react-router-dom';
import { ErrorScreen } from '../components/feedback/ErrorScreen.js';
import { LoadingScreen } from '../components/feedback/LoadingScreen.js';
import { AdminPage } from '../features/admin/pages/AdminPage.js';
import { AccountSecurityPage } from '../features/auth/pages/AccountSecurityPage.js';
import { LoginPage } from '../features/auth/pages/LoginPage.js';
import { RegisterPage } from '../features/auth/pages/RegisterPage.js';
import { RequestPasswordResetPage } from '../features/auth/pages/RequestPasswordResetPage.js';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage.js';
import { CommunityPage } from '../features/communities/pages/CommunityPage.js';
import { CommunitiesPage } from '../features/communities/pages/CommunitiesPage.js';
import { DiscussionPage } from '../features/communities/pages/DiscussionPage.js';
import { ExplorePage } from '../features/discovery/pages/ExplorePage.js';
import { BookPage } from '../features/library/pages/BookPage.js';
import { LibraryPage } from '../features/library/pages/LibraryPage.js';
import { NewsArticlePage } from '../features/news/pages/NewsArticlePage.js';
import { NotificationsPage } from '../features/notifications/pages/NotificationsPage.js';
import { PostDetailPage } from '../features/posts/pages/PostDetailPage.js';
import { ProfilePage } from '../features/profiles/pages/ProfilePage.js';
import { ProjectPage } from '../features/projects/pages/ProjectPage.js';
import { ProjectsPage } from '../features/projects/pages/ProjectsPage.js';
import { ResearchPage } from '../features/research/pages/ResearchPage.js';
import { HomePage } from '../features/social/pages/HomePage.js';
import { NotFoundPage } from '../features/system/pages/NotFoundPage.js';
import { AppShell } from './shell/AppShell.js';
import { useAppState } from './state/useAppState.js';

export function App() {
  const { status, error, reload } = useAppState();

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'error') {
    return (
      <ErrorScreen
        message={error || 'Não foi possível carregar o Lorion.'}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explorar" element={<ExplorePage />} />
        <Route path="/comunidades" element={<CommunitiesPage />} />
        <Route path="/comunidades/:slug" element={<CommunityPage />} />
        <Route path="/discussoes/:id" element={<DiscussionPage />} />
        <Route path="/publicacoes/:id" element={<PostDetailPage />} />
        <Route path="/biblioteca" element={<LibraryPage />} />
        <Route path="/livros/:id" element={<BookPage />} />
        <Route path="/pesquisas/:slug" element={<ResearchPage />} />
        <Route path="/projetos" element={<ProjectsPage />} />
        <Route path="/projetos/:id" element={<ProjectPage />} />
        <Route path="/noticias/:slug" element={<NewsArticlePage />} />
        <Route path="/perfil/:username" element={<ProfilePage />} />
        <Route path="/conta/seguranca" element={<AccountSecurityPage />} />
        <Route path="/notificacoes" element={<NotificationsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/esqueci-a-senha" element={<RequestPasswordResetPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}

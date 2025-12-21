import { Component, Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MatchProvider } from './context/MatchContext';
const lazyWithRetry = (factory: () => Promise<{ default: React.ComponentType<any> }>) =>
  lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      const message = err?.message ?? '';
      // Handle stale chunk loads (e.g., deployment race) by forcing a one-time reload.
      const isMimeTypeError = message.includes('valid JavaScript MIME type');
      const isChunkError = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(message);
      if ((isMimeTypeError || isChunkError) && typeof window !== 'undefined') {
        const win = window as Window & { __lazyChunkReloaded?: boolean };
        if (!win.__lazyChunkReloaded) {
          win.__lazyChunkReloaded = true;
          win.location.reload();
          return new Promise(() => {
            /* wait for reload */
          });
        }
      }
      throw err;
    }
  });

const AdminLayout = lazyWithRetry(async () => ({
  default: (await import('./components/admin/AdminLayout')).AdminLayout,
}));
const Dashboard = lazyWithRetry(() => import('./components/Dashboard'));
const MatchTracker = lazyWithRetry(() => import('./components/MatchTracker'));
const VideoMatchTracker = lazyWithRetry(() => import('./components/VideoMatchTracker'));
const Statistics = lazyWithRetry(() => import('./components/Statistics'));
const MatchesManagement = lazyWithRetry(async () => ({
  default: (await import('./components/admin/MatchesManagement')).MatchesManagement,
}));
const ClubsManagement = lazyWithRetry(async () => ({
  default: (await import('./components/admin/ClubsManagement')).ClubsManagement,
}));
const SeasonsManagement = lazyWithRetry(async () => ({
  default: (await import('./components/admin/SeasonsManagement')).SeasonsManagement,
}));
const PlayersManagement = lazyWithRetry(async () => ({
  default: (await import('./components/admin/PlayersManagement')).PlayersManagement,
}));
const ImportPlayers = lazyWithRetry(async () => ({
  default: (await import('./components/admin/ImportPlayers')).ImportPlayers,
}));
const TeamsManagement = lazyWithRetry(async () => ({
  default: (await import('./components/admin/TeamsManagement')).TeamsManagement,
}));
const PlayerFormPage = lazyWithRetry(async () => ({
  default: (await import('./components/admin/players/PlayerFormPage')).PlayerFormPage,
}));
const TeamFormPage = lazyWithRetry(async () => ({
  default: (await import('./components/admin/teams/TeamFormPage')).TeamFormPage,
}));
const TeamPlayersPage = lazyWithRetry(async () => ({
  default: (await import('./components/admin/teams/TeamPlayersPage')).TeamPlayersPage,
}));
const MatchFormPage = lazyWithRetry(async () => ({
  default: (await import('./components/admin/matches/MatchFormPage')).MatchFormPage,
}));

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-600">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-red-50 p-4 rounded overflow-auto">
            {this.state.error?.toString()}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

import { PageTitleUpdater } from './components/common/PageTitleUpdater';

function App() {
  return (
    <ErrorBoundary>
      <MatchProvider>
        <Router>
          <PageTitleUpdater />
          <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
            <Routes>
              <Route path="/" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="clubs" element={<ClubsManagement />} />
                <Route path="seasons" element={<SeasonsManagement />} />
                <Route path="players" element={<PlayersManagement />} />
                <Route path="players/new" element={<PlayerFormPage />} />
                <Route path="players/:id/edit" element={<PlayerFormPage />} />
                <Route path="players/import" element={<ImportPlayers />} />
                <Route path="teams" element={<TeamsManagement />} />
                <Route path="teams/new" element={<TeamFormPage />} />
                <Route path="teams/:id/edit" element={<TeamFormPage />} />
                <Route path="teams/:id/players" element={<TeamPlayersPage />} />
                <Route path="matches" element={<MatchesManagement />} />
                <Route path="matches/new" element={<MatchFormPage />} />
                <Route path="matches/:id/edit" element={<MatchFormPage />} />
                <Route path="statistics" element={<Statistics />} />
              </Route>
              <Route path="/match-tracker/:matchId" element={<MatchTracker />} />
              <Route path="/video-tracker/:matchId" element={<VideoMatchTracker />} />
            </Routes>
          </Suspense>
        </Router>
      </MatchProvider>
    </ErrorBoundary>
  );
}

export default App;

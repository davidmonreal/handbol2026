import { Component } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MatchProvider } from './context/MatchContext';
import { AdminLayout } from './components/admin/AdminLayout';
import Dashboard from './components/Dashboard';
import MatchTracker from './components/MatchTracker';
import Statistics from './components/Statistics';
import { MatchesManagement } from './components/admin/MatchesManagement';
import { ClubsManagement } from './components/admin/ClubsManagement';
import { SeasonsManagement } from './components/admin/SeasonsManagement';
import { PlayersManagement } from './components/admin/PlayersManagement';
import { ImportPlayers } from './components/admin/ImportPlayers';
import { TeamsManagement } from './components/admin/TeamsManagement';
import { PlayerFormPage } from './components/admin/players/PlayerFormPage';
import { TeamFormPage } from './components/admin/teams/TeamFormPage';
import { MatchFormPage } from './components/admin/matches/MatchFormPage';

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

function App() {
  return (
    <ErrorBoundary>
      <MatchProvider>
        <Router>
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
              <Route path="matches" element={<MatchesManagement />} />
              <Route path="matches/new" element={<MatchFormPage />} />
              <Route path="matches/:id/edit" element={<MatchFormPage />} />
              <Route path="statistics" element={<Statistics />} />
            </Route>
            <Route path="/match-tracker/:matchId" element={<MatchTracker />} />
          </Routes>
        </Router>
      </MatchProvider>
    </ErrorBoundary>
  );
}

export default App;

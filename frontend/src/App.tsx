import { useState, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import MatchTracker from './components/MatchTracker';
import Statistics from './components/Statistics';
import { MatchProvider } from './context/MatchContext';
import { AdminLayout } from './components/admin/AdminLayout';
import { ClubsManagement } from './components/admin/ClubsManagement';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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

// Placeholder Components
const HomeView = () => <div className="p-8 text-center text-gray-500">Home View (Coming Soon)</div>;
const MatchView = () => <MatchTracker />;
const StatsView = () => <Statistics />;
import { SeasonsManagement } from './components/admin/SeasonsManagement';
import { PlayersManagement } from './components/admin/PlayersManagement';
import { TeamsManagement } from './components/admin/TeamsManagement';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'match' | 'stats' | 'admin'>('home');
  const [adminView, setAdminView] = useState('clubs');

  const AdminView = () => (
    <AdminLayout 
      onNavigateHome={() => setCurrentView('match')}
      onNavigate={setAdminView}
      currentView={adminView}
    >
      {adminView === 'clubs' && <ClubsManagement />}
      {adminView === 'seasons' && <SeasonsManagement />}
      {adminView === 'players' && <PlayersManagement />}
      {adminView === 'teams' && <TeamsManagement />}
      {adminView === 'matches' && <div className="p-8 text-center text-gray-500">Matches Management (Coming Soon)</div>}
    </AdminLayout>
  );

  return (
    <ErrorBoundary>
      <MatchProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-blue-600">🤾 Handbol 2026</h1>
                </div>
                <div className="flex space-x-4 items-center">
                  <button
                    onClick={() => setCurrentView('home')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView === 'home'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Inici
                  </button>
                  <button
                    onClick={() => setCurrentView('match')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView === 'match'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Partit
                  </button>
                  <button
                    onClick={() => setCurrentView('stats')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView === 'stats'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Estadístiques
                  </button>
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView === 'admin'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Gestió
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {currentView === 'home' && <HomeView />}
            {currentView === 'match' && <MatchView />}
            {currentView === 'stats' && <StatsView />}
            {currentView === 'admin' && <AdminView />}
          </main>
        </div>
      </MatchProvider>
    </ErrorBoundary>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { LoadingGrid, ErrorMessage } from './common';
import { MatchCard } from './match/MatchCard';
import type { DashboardMatch } from './match/MatchCard';

type Match = DashboardMatch;

// ...

const Dashboard = () => {
  const navigate = useNavigate();
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const myPendingMatches = pendingMatches.filter(
    match => match.homeTeam?.isMyTeam || match.awayTeam?.isMyTeam,
  );

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/matches`);
      if (response.ok) {
        const data = await response.json();
        const pending = data.filter((m: Match) => !m.isFinished).sort((a: Match, b: Match) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const past = data.filter((m: Match) => m.isFinished).sort((a: Match, b: Match) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPendingMatches(pending);
        setPastMatches(past);
      } else {
        setError('Failed to load matches');
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to connect to the server. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Loading your matches...</p>
          </div>
        </div>
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Upcoming Matches
            </h2>
          </div>
          <LoadingGrid items={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, Coach</p>
        </div>
        <button
          onClick={() => navigate('/matches')}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          New Match
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchMatches}
        />
      )}

      {/* Next matches strip (first three upcoming) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
          <h2 className="text-lg font-semibold text-gray-900">Upcoming for your teams</h2>
        </div>
        {myPendingMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 xl:gap-10">
            {myPendingMatches.slice(0, 3).map(match => (
              <MatchCard key={`next-${match.id}`} match={match} isPending={true} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
            No upcoming matches for your teams.
          </div>
        )}
      </section>

      {/* Pending Matches */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Upcoming Matches
          </h2>
          <button
            onClick={() => navigate('/matches')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
          >
            View All <ChevronRight size={16} />
          </button>
        </div>

        {pendingMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8">
            {pendingMatches.map(match => (
              <MatchCard key={match.id} match={match} isPending={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">No upcoming matches</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by scheduling a new match.</p>
            <button
              onClick={() => navigate('/matches')}
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              Schedule Match
            </button>
          </div>
        )}
      </section>

      {/* Past Matches */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            Recent History
          </h2>
        </div>

        {pastMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8">
            {pastMatches.map(match => (
              <MatchCard key={match.id} match={match} isPending={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No past matches found.
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

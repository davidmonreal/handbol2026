import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Clock, MapPin, ChevronRight, Play, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

interface Team {
  id: string;
  name: string;
  club: { name: string };
}

interface Match {
  id: string;
  date: string;
  homeTeam: Team;
  awayTeam: Team;
  isFinished: boolean;
  location?: string;
  homeScore?: number;
  awayScore?: number;
}

// ...

const Dashboard = () => {
  const navigate = useNavigate();
  const [pendingMatches, setPendingMatches] = useState<Match[]>([]);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/matches');
      if (response.ok) {
        const data = await response.json();
        const pending = data.filter((m: Match) => !m.isFinished).sort((a: Match, b: Match) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const past = data.filter((m: Match) => m.isFinished).sort((a: Match, b: Match) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPendingMatches(pending);
        setPastMatches(past);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const MatchCard = ({ match, isPending }: { match: Match; isPending: boolean }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center text-gray-500 text-sm">
          <Calendar size={14} className="mr-1.5" />
          <span className="mr-3">{format(new Date(match.date), 'MMM d, yyyy')}</span>
          <Clock size={14} className="mr-1.5" />
          <span>{format(new Date(match.date), 'HH:mm')}</span>
        </div>
        {isPending ? (
          <button
            onClick={() => navigate(`/match-tracker/${match.id}`)}
            className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Play size={12} className="mr-1.5" />
            Play
          </button>
        ) : (
          <button
            onClick={() => navigate(`/match-tracker/${match.id}`)}
            className="flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={12} className="mr-1.5" />
            Edit
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 text-right min-w-0">
          <div className="font-semibold text-gray-900 truncate">{match.homeTeam?.name || 'Unknown Team'}</div>
          <div className="text-xs text-gray-500 truncate">{match.homeTeam?.club?.name || 'Unknown Club'}</div>
        </div>
        
        {isPending ? (
          <div className="px-4 text-gray-400 font-medium">VS</div>
        ) : (
          <div className="px-4 flex items-center justify-center gap-3 min-w-[100px]">
            <span className="text-3xl font-bold text-gray-900">{match.homeScore ?? 0}</span>
            <span className="text-gray-400 text-xs uppercase tracking-wider font-medium">vs</span>
            <span className="text-3xl font-bold text-gray-900">{match.awayScore ?? 0}</span>
          </div>
        )}

        <div className="flex-1 text-left min-w-0">
          <div className="font-semibold text-gray-900 truncate">{match.awayTeam?.name || 'Unknown Team'}</div>
          <div className="text-xs text-gray-500 truncate">{match.awayTeam?.club?.name || 'Unknown Club'}</div>
        </div>
      </div>

      {match.location && (
        <div className="flex items-center text-gray-400 text-xs mt-2 pt-2 border-t border-gray-50">
          <MapPin size={12} className="mr-1" />
          {match.location}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

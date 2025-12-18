import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Play, Volleyball, Edit2 } from 'lucide-react';
import { useSafeTranslation } from '../../context/LanguageContext';
import { formatCategoryLabel } from '../../utils/categoryLabels';

interface Team {
  id: string;
  name: string;
  category?: string;
  club?: { name: string };
  isMyTeam?: boolean;
}

export interface DashboardMatch {
  id: string;
  date: string;
  homeTeam: Team;
  awayTeam: Team;
  isFinished: boolean;
  location?: string;
  homeScore?: number;
  awayScore?: number;
  videoUrl?: string | null;
  homeEventsLocked?: boolean;
  awayEventsLocked?: boolean;
}

export const MatchCard = ({ match, isPending }: { match: DashboardMatch; isPending: boolean }) => {
  const navigate = useNavigate();
  const { t } = useSafeTranslation();
  const isViewOnly = match.homeEventsLocked && match.awayEventsLocked;
  const primaryActionLabel = isViewOnly ? 'View plays' : 'Add plays';
  const homeCategoryLabel = formatCategoryLabel(match.homeTeam?.category, t);
  const awayCategoryLabel = formatCategoryLabel(match.awayTeam?.category, t);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-3 pt-4 pb-2 hover:shadow-md transition-shadow min-w-[280px] w-full">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar size={14} className="mr-1.5" />
            <span className="mr-3">{format(new Date(match.date), 'MMM d, yyyy')}</span>
            <Clock size={14} className="mr-1.5" />
            <span>{format(new Date(match.date), 'HH:mm')}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 text-right min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {homeCategoryLabel && `${homeCategoryLabel} `}{match.homeTeam?.name || 'Unknown Team'}
              </div>
              <div className="text-xs text-gray-500 truncate">{match.homeTeam?.club?.name || 'Unknown Club'}</div>
            </div>

            {isPending && !match.homeScore && !match.awayScore ? (
              <div className="px-4 text-gray-400 font-medium">VS</div>
            ) : (
              <div className="px-4 flex items-center justify-center gap-3 min-w-[100px]">
                <span className="text-3xl font-bold text-gray-900">{match.homeScore ?? 0}</span>
                <span className="text-gray-400 text-3xl font-light pb-1">:</span>
                <span className="text-3xl font-bold text-gray-900">{match.awayScore ?? 0}</span>
              </div>
            )}

            <div className="flex-1 text-left min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {awayCategoryLabel && `${awayCategoryLabel} `}{match.awayTeam?.name || 'Unknown Team'}
              </div>
              <div className="text-xs text-gray-500 truncate">{match.awayTeam?.club?.name || 'Unknown Club'}</div>
            </div>
          </div>

          {match.location && (
            <div className="flex items-center text-gray-400 text-xs pt-2 border-t border-gray-50">
              <MapPin size={12} className="mr-1" />
              {match.location}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-1.5">
          <button
            onClick={() => navigate(`/match-tracker/${match.id}`)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {isViewOnly ? <Play size={12} className="mr-1.5" /> : <Volleyball size={12} className="mr-1.5" />}
            {primaryActionLabel}
          </button>
          <button
            onClick={() => navigate(`/video-tracker/${match.id}`)}
            className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg transition-colors border ${match.videoUrl
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            title={match.videoUrl ? 'Track with YouTube video' : 'Add YouTube'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </button>
          <button
            onClick={() => navigate(`/matches/${match.id}/edit`)}
            className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={12} className="mr-1.5" />
            Edit match
          </button>
        </div>
      </div>
    </div>
  );
};

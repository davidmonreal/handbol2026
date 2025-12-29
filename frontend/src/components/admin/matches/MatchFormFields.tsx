import { Calendar } from 'lucide-react';
import { SearchableSelectWithCreate } from '../../common/SearchableSelectWithCreate';
import type { Team } from '../../../types';

type MatchFormFieldsProps = {
    teams: Team[];
    dateValue: string;
    timeValue: string;
    selectedHomeTeamId: string | null;
    selectedAwayTeamId: string | null;
    status: 'SCHEDULED' | 'FINISHED';
    homeScore: string;
    awayScore: string;
    onDateChange: (value: string) => void;
    onTimeChange: (value: string) => void;
    onHomeTeamChange: (value: string) => void;
    onAwayTeamChange: (value: string) => void;
    onStatusChange: (value: 'SCHEDULED' | 'FINISHED') => void;
    onHomeScoreChange: (value: string) => void;
    onAwayScoreChange: (value: string) => void;
};

export const MatchFormFields = ({
    teams,
    dateValue,
    timeValue,
    selectedHomeTeamId,
    selectedAwayTeamId,
    status,
    homeScore,
    awayScore,
    onDateChange,
    onTimeChange,
    onHomeTeamChange,
    onAwayTeamChange,
    onStatusChange,
    onHomeScoreChange,
    onAwayScoreChange,
}: MatchFormFieldsProps) => (
    <>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="match-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                </label>
                <div className="relative">
                    <Calendar
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                    />
                    <input
                        id="match-date"
                        type="date"
                        value={dateValue}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="match-time" className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                </label>
                <input
                    id="match-time"
                    type="time"
                    value={timeValue}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
            </div>
        </div>

        <SearchableSelectWithCreate
            label="Home Team *"
            value={selectedHomeTeamId}
            options={teams.map((t) => ({
                value: t.id,
                label: [t.club?.name, t.category, t.name].filter(Boolean).join(' ') || t.name,
            }))}
            onChange={onHomeTeamChange}
            placeholder="Select home team..."
        />

        <SearchableSelectWithCreate
            label="Away Team *"
            value={selectedAwayTeamId}
            options={teams.map((t) => ({
                value: t.id,
                label: [t.club?.name, t.category, t.name].filter(Boolean).join(' ') || t.name,
            }))}
            onChange={onAwayTeamChange}
            placeholder="Select away team..."
        />

        <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">Match Status</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => onStatusChange('SCHEDULED')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            status === 'SCHEDULED'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Scheduled
                    </button>
                    <button
                        type="button"
                        onClick={() => onStatusChange('FINISHED')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            status === 'FINISHED'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Finished
                    </button>
                </div>
            </div>

            {status === 'FINISHED' && (
                <div className="grid grid-cols-2 gap-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-right">
                        <label htmlFor="match-home-score" className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                            Home Score
                        </label>
                        <input
                            id="match-home-score"
                            type="number"
                            min="0"
                            value={homeScore}
                            onChange={(e) => onHomeScoreChange(e.target.value)}
                            placeholder="0"
                            className="w-24 text-center text-2xl font-bold text-gray-900 border-b-2 border-gray-300 focus:border-indigo-500 bg-transparent outline-none p-2"
                        />
                    </div>
                    <div className="text-left">
                        <label htmlFor="match-away-score" className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                            Away Score
                        </label>
                        <input
                            id="match-away-score"
                            type="number"
                            min="0"
                            value={awayScore}
                            onChange={(e) => onAwayScoreChange(e.target.value)}
                            placeholder="0"
                            className="w-24 text-center text-2xl font-bold text-gray-900 border-b-2 border-gray-300 focus:border-red-500 bg-transparent outline-none p-2"
                        />
                    </div>
                </div>
            )}
        </div>
    </>
);

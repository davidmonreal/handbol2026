import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toTitleCase } from '../../../utils/textUtils';
import type { DuplicateMatch } from '../../../services/playerImportService';

interface PlayerBasicInfoProps {
    name: string;
    number: number | '';
    onNameChange: (name: string) => void;
    onNumberChange: (num: number | '') => void;
    isEditMode: boolean;
    duplicateState: {
        matches: DuplicateMatch[];
        hasWarning: boolean;
        isChecking: boolean;
        ignore: boolean;
    };
    onIgnoreDuplicates: (ignore: boolean) => void;
}

export const PlayerBasicInfo: React.FC<PlayerBasicInfoProps> = ({
    name,
    number,
    onNameChange,
    onNumberChange,
    isEditMode,
    duplicateState,
    onIgnoreDuplicates
}) => {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="e.g. Jordi Casanovas"
                />

                {/* Duplicate Detection UI */}
                {!isEditMode && name.trim().length >= 3 && (
                    <div className="mt-2">
                        {duplicateState.isChecking && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 size={14} className="animate-spin" />
                                <span>Checking for duplicates...</span>
                            </div>
                        )}

                        {!duplicateState.isChecking && !duplicateState.hasWarning && !duplicateState.ignore && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle size={14} />
                                <span>Aquest jugador encara no existeix a la BBDD</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
                <input
                    type="number"
                    value={number}
                    onChange={(e) => onNumberChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center font-mono text-lg"
                    placeholder="#"
                />
            </div>

            {/* Full Width Duplicate Warning */}
            {!isEditMode && duplicateState.hasWarning && !duplicateState.ignore && (
                <div className="md:col-span-3 mt-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {duplicateState.matches.map((match, idx) => (
                        <div key={idx} className="bg-white p-4 flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                    {match.name}
                                    {match.number && <span className="text-gray-500">#{match.number}</span>}
                                </div>
                                {match.teams && match.teams.length > 0 ? (
                                    <div className="text-sm text-gray-500 mt-0.5">
                                        {match.teams.map(t => `${t.club} ${toTitleCase(t.name)}`).join(', ')}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-400 italic mt-0.5">No active teams</div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/players/${match.id}/edit`)}
                                    className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    View/Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/players')}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onIgnoreDuplicates(true)}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toTitleCase } from '../../../utils/textUtils';
import type { DuplicateMatch } from '../../../services/playerImportService';
import { useSafeTranslation } from '../../../context/LanguageContext';

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
    };
    onIgnoreMatch: (id: string) => void;
}

export const PlayerBasicInfo: React.FC<PlayerBasicInfoProps> = ({
    name,
    number,
    onNameChange,
    onNumberChange,
    isEditMode,
    duplicateState,
    onIgnoreMatch
}) => {
    const navigate = useNavigate();
    const { t } = useSafeTranslation();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('playerForm.fullNameLabel')}
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder={t('playerForm.fullNamePlaceholder')}
                />

                {/* Duplicate Detection UI */}
                {!isEditMode && name.trim().length >= 3 && (
                    <div className="mt-2">
                        {duplicateState.isChecking && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 size={14} className="animate-spin" />
                                <span className="text-gray-500">{t('playerForm.checkingDuplicates')}</span>
                            </div>
                        )}

                        {!duplicateState.isChecking && !duplicateState.hasWarning && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle size={14} />
                                <span>{t('playerForm.noDuplicates')}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('playerForm.numberLabel')}
                </label>
                <input
                    type="number"
                    value={number}
                    onChange={(e) => onNumberChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-center font-mono text-lg"
                    placeholder={t('playerForm.numberPlaceholder')}
                />
            </div>

            {/* Full Width Duplicate Warning */}
            {!isEditMode && duplicateState.hasWarning && (
                <div className="md:col-span-3 mt-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-yellow-50 px-4 py-2 text-sm text-yellow-800 font-medium border-b border-yellow-200">
                        {t('playerForm.duplicatePromptTitle')}
                    </div>
                    {duplicateState.matches.map((match, idx) => (
                        <div key={idx} className="bg-white p-4 flex items-center justify-between gap-4 border-b last:border-b-0 border-gray-100">
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
                                    <div className="text-sm text-gray-400 italic mt-0.5">
                                        {t('playerForm.noActiveTeams')}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => onIgnoreMatch(match.id)}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    {t('playerForm.differentPlayer')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/players')}
                                    className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    {t('playerForm.samePlayer')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

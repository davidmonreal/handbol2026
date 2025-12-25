import React, { useState } from 'react';
import { SearchableSelectWithCreate } from '../../common/SearchableSelectWithCreate';
import { toTitleCase } from '../../../utils/textUtils';
import { TEAM_CATEGORIES } from '../../../utils/teamUtils';
import type { Club, Season } from '../../../types';
import { useSafeTranslation } from '../../../context/LanguageContext';

interface TeamCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    clubs: Club[];
    seasons: Season[];
    initialClubId: string | null;
    initialCategory: string;
    onCreateClub: (name: string) => Promise<Club | undefined>;
    onCreateTeam: (data: { clubId: string; seasonId: string; category: string; name: string }) => Promise<void>;
}

export const TeamCreationModal: React.FC<TeamCreationModalProps> = ({
    isOpen,
    onClose,
    clubs,
    seasons,
    initialClubId,
    initialCategory,
    onCreateClub,
    onCreateTeam
}) => {
    const { t } = useSafeTranslation();
    const [selectedClubId, setSelectedClubId] = useState<string | null>(initialClubId);
    const [category, setCategory] = useState(initialCategory || TEAM_CATEGORIES[0]);
    const [seasonId, setSeasonId] = useState<string>('');
    const [name, setName] = useState('');

    // Pre-select current season
    React.useEffect(() => {
        if (seasons.length > 0 && !seasonId) {
            const now = new Date();
            const current = seasons.find(s => {
                const start = new Date(s.startDate);
                const end = new Date(s.endDate);
                return now >= start && now <= end;
            });
            setSeasonId(current?.id || seasons[0].id || '');
        }
    }, [seasons, seasonId]);

    // Update state when initial props change
    React.useEffect(() => {
        if (isOpen) {
            if (initialClubId) setSelectedClubId(initialClubId);
            if (initialCategory) setCategory(initialCategory);
        }
    }, [isOpen, initialClubId, initialCategory]);

    const handleSubmit = async () => {
        if (!selectedClubId) return alert(t('teamModal.selectClubAlert'));
        if (!seasonId) return alert(t('teamModal.selectSeasonAlert'));

        await onCreateTeam({
            clubId: selectedClubId,
            seasonId,
            category,
            name
        });
        onClose();
        // Reset form? Optional
        setName('');
    };

    const handleCreateClub = async (name: string) => {
        const newClub = await onCreateClub(name);
        if (newClub) setSelectedClubId(newClub.id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">{t('teamModal.title')}</h3>
                <div className="space-y-4">
                    {/* Club */}
                    <SearchableSelectWithCreate
                        label={t('teamModal.clubLabel')}
                        value={selectedClubId}
                        options={clubs.map(c => ({ value: c.id, label: c.name }))}
                        onChange={setSelectedClubId}
                        onCreate={handleCreateClub}
                        placeholder={t('teamModal.clubPlaceholder')}
                    />

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('teamModal.categoryLabel')}
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            {TEAM_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{toTitleCase(cat)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Season */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('teamModal.seasonLabel')}
                        </label>
                        <select
                            value={seasonId}
                            onChange={(e) => setSeasonId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            {seasons.map(season => (
                                <option key={season.id} value={season.id}>{season.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Team Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('teamModal.teamNameLabel')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder={t('teamModal.teamNamePlaceholder')}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            {t('teamModal.cancel')}
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            {t('teamModal.createTeam')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

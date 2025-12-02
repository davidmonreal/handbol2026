import { Loader2 } from 'lucide-react';
import { SearchableSelectWithCreate } from '../../common/SearchableSelectWithCreate';

interface Team {
    id: string;
    name: string;
    club: {
        name: string;
    };
    category: string;
}

interface TeamSelectorProps {
    teams: Team[];
    selectedTeamId: string | null;
    onTeamChange: (teamId: string | null) => void;
    isCheckingDuplicates: boolean;
}

export const TeamSelector = ({
    teams,
    selectedTeamId,
    onTeamChange,
    isCheckingDuplicates
}: TeamSelectorProps) => {
    return (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-bold text-blue-900 mb-2">
                Select Team (Required) *
            </label>
            <SearchableSelectWithCreate
                label=""
                value={selectedTeamId}
                options={teams.map(t => ({
                    value: t.id,
                    label: `${t.club.name} ${t.category} ${t.name}`
                }))}
                onChange={(value) => onTeamChange(value)}
                onCreate={() => { }}
                placeholder="Search for a team..."
            />
            {!selectedTeamId && (
                <p className="text-xs text-blue-700 mt-2">
                    ⚠️ You must select a team before importing
                </p>
            )}
            {isCheckingDuplicates && (
                <p className="text-xs text-blue-700 mt-2 flex items-center gap-2">
                    <Loader2 className="animate-spin" size={12} />
                    Checking for duplicates...
                </p>
            )}
        </div>
    );
};

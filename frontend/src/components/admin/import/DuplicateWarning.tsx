import { AlertTriangle } from 'lucide-react';

interface DuplicateMatch {
    id: string;
    name: string;
    distance: number;
    similarity: number;
    teams?: { id: string; name: string; club: string; number?: number }[];
}

interface DuplicateInfo {
    name: string;
    hasDuplicates: boolean;
    matches: DuplicateMatch[];
}

interface DuplicateWarningProps {
    duplicate: DuplicateInfo;
    onReviewClick: () => void;
}

export const DuplicateWarning = ({ duplicate, onReviewClick }: DuplicateWarningProps) => {
    return (
        <div className="mt-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-3 shadow-sm">
            <div className="flex items-start gap-2">
                <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                    <p className="text-sm font-bold text-amber-900 mb-1">
                        ⚠️ Possible duplicate detected!
                    </p>
                    <div className="text-xs text-amber-800 mb-2 space-y-0.5">
                        {duplicate.matches.slice(0, 2).map((match, i) => (
                            <div key={i} className="flex items-center justify-between bg-white bg-opacity-50 rounded px-2 py-1">
                                <span className="font-medium">
                                    {match.name}
                                </span>
                                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                                    {Math.round(match.similarity * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                    {duplicate.matches[0]?.teams && duplicate.matches[0].teams.length > 0 && (
                        <div className="text-xs text-amber-800">
                            {duplicate.matches[0].teams.slice(0, 2).map((team) => (
                                <span key={team.id} className="mr-2">
                                    {team.club} {team.name}{team.number === undefined ? '' : ` #${team.number}`}
                                </span>
                            ))}
                        </div>
                    )}
                    {/* Single review button */}
                    <button
                        onClick={onReviewClick}
                        className="w-full text-sm px-4 py-2 bg-amber-600 text-white rounded-lg font-medium shadow-sm hover:bg-amber-700 transition-all"
                    >
                        Review Duplicate
                    </button>
                </div>
            </div>
        </div>
    );
};

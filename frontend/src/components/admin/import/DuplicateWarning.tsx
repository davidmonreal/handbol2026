import { AlertTriangle } from 'lucide-react';

interface DuplicateMatch {
    id: string;
    name: string;
    number: number;
    distance: number;
    similarity: number;
    teams?: { id: string; name: string; club: string }[];
}

interface DuplicateInfo {
    name: string;
    hasDuplicates: boolean;
    matches: DuplicateMatch[];
}

interface DuplicateWarningProps {
    duplicate: DuplicateInfo;
    action?: 'merge' | 'skip' | 'keep';
    onActionChange: (action: 'merge' | 'skip' | 'keep') => void;
}

export const DuplicateWarning = ({ duplicate, action, onActionChange }: DuplicateWarningProps) => {
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
                                    {match.name} <span className="text-amber-600">#{match.number}</span>
                                </span>
                                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                                    {Math.round(match.similarity * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                    {/* Resolution options */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onActionChange('skip')}
                            className={`flex-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all shadow-sm ${action === 'skip'
                                ? 'bg-red-600 text-white ring-2 ring-red-300'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                        >
                            Skip
                        </button>
                        <button
                            onClick={() => onActionChange('merge')}
                            className={`flex-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all shadow-sm ${action === 'merge'
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                                : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                                }`}
                        >
                            Merge
                        </button>
                        <button
                            onClick={() => onActionChange('keep')}
                            className={`flex-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all shadow-sm ${action === 'keep'
                                ? 'bg-green-600 text-white ring-2 ring-green-300'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                        >
                            Keep Both
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

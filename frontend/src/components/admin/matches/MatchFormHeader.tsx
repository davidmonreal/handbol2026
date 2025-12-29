import { ArrowLeft } from 'lucide-react';

type MatchFormHeaderProps = {
    isEditMode: boolean;
    onBack: () => void;
};

export const MatchFormHeader = ({ isEditMode, onBack }: MatchFormHeaderProps) => (
    <div className="flex items-center gap-4 mb-6">
        <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
        >
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
            {isEditMode ? 'Edit Match' : 'New Match'}
        </h1>
    </div>
);

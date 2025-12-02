import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { clubName: string; teamName: string; category: string }) => Promise<void>;
    initialTeamName: string;
}

export const CreateTeamModal = ({ isOpen, onClose, onSubmit, initialTeamName }: CreateTeamModalProps) => {
    const [clubName, setClubName] = useState('');
    const [teamName, setTeamName] = useState('');
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTeamName(initialTeamName);
            setClubName('');
            setCategory('');
            setError(null);
        }
    }, [isOpen, initialTeamName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clubName.trim() || !teamName.trim() || !category.trim()) {
            setError('All fields are required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit({
                clubName: clubName.trim(),
                teamName: teamName.trim(),
                category: category.trim()
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create team');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Create New Team</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Club Name *
                        </label>
                        <input
                            type="text"
                            value={clubName}
                            onChange={(e) => setClubName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. FC Barcelona"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                        </label>
                        <div className="relative">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-white"
                            >
                                <option value="" disabled>Select a category...</option>
                                <option value="BENJAMI">BENJAMI</option>
                                <option value="ALEVI">ALEVI</option>
                                <option value="INFANTIL">INFANTIL</option>
                                <option value="CADET">CADET</option>
                                <option value="JUVENIL">JUVENIL</option>
                                <option value="SENIOR">SENIOR</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Team Name *
                        </label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. Handbol 2026"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This is usually the specific name of the team within the club.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Create Team
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

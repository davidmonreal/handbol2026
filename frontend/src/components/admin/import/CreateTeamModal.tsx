import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { toTitleCase } from '../../../utils/textUtils';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { clubName: string; teamName: string; category: string }) => Promise<void>;
    initialTeamName: string;
    applyTitleCase?: boolean; // Optional: apply title case transformation to team and club names
}

export const CreateTeamModal = ({ isOpen, onClose, onSubmit, initialTeamName, applyTitleCase = true }: CreateTeamModalProps) => {
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
                            Team Name
                        </label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(applyTitleCase ? toTitleCase(e.target.value) : e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. Cadet A"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                        </label>
                        <div className="relative">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-white"
                            >
                                <option value="" disabled>Select Category</option>
                                <option value="BENJAMI">Benjamí</option>
                                <option value="ALEVI">Aleví</option>
                                <option value="INFANTIL">Infantil</option>
                                <option value="CADET">Cadet</option>
                                <option value="JUVENIL">Juvenil</option>
                                <option value="SENIOR">Sènior</option>
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
                            Club
                        </label>
                        <input
                            type="text"
                            value={clubName}
                            onChange={(e) => setClubName(applyTitleCase ? toTitleCase(e.target.value) : e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. FC Barcelona"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Season
                        </label>
                        <select
                            value="2024-2025"
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        >
                            <option value="2024-2025">2024-2025</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Season selection will be available in future versions
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isMyTeam"
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isMyTeam" className="text-sm font-medium text-gray-700">
                            Is My Team
                        </label>
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

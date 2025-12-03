import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ExtractedPlayer } from '../../../services/playerImportService';

interface EditPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (player: ExtractedPlayer) => void;
    player: ExtractedPlayer | null;
}

export const EditPlayerModal = ({ isOpen, onClose, onSave, player }: EditPlayerModalProps) => {
    const [formData, setFormData] = useState<ExtractedPlayer>({
        name: '',
        number: 0,
        handedness: undefined,
        isGoalkeeper: false
    });

    useEffect(() => {
        if (player) {
            setFormData(player);
        }
    }, [player]);

    if (!isOpen || !player) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Edit Player</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
                        <input
                            type="number"
                            value={formData.number}
                            onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Handedness</label>
                            <select
                                value={formData.handedness || ''}
                                onChange={(e) => setFormData({ ...formData, handedness: e.target.value as any || undefined })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Unknown</option>
                                <option value="RIGHT">Right</option>
                                <option value="LEFT">Left</option>
                            </select>
                        </div>

                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isGoalkeeper || false}
                                    onChange={(e) => setFormData({ ...formData, isGoalkeeper: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Goalkeeper</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

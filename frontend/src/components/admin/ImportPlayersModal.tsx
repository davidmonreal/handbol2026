import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

interface ExtractedPlayer {
    name: string;
    number: number;
    handedness?: 'left' | 'right' | 'both';
    isGoalkeeper?: boolean;
}

interface ImportPlayersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (players: ExtractedPlayer[]) => void;
}

export const ImportPlayersModal = ({ isOpen, onClose, onImport }: ImportPlayersModalProps) => {
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedPlayers, setExtractedPlayers] = useState<ExtractedPlayer[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExtract = async () => {
        if (!image) return;

        setIsProcessing(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/import-players-from-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process image');
            }

            const data = await response.json();
            setExtractedPlayers(data.players);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmImport = () => {
        onImport(extractedPlayers);
        handleClose();
    };

    const handleClose = () => {
        setImage(null);
        setExtractedPlayers([]);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Import Players from Image</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {!extractedPlayers.length ? (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="image-upload"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer">
                                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">
                                    Click to upload or drag and drop<br />
                                    PNG, JPG up to 10MB
                                </p>
                            </label>
                        </div>

                        {image && (
                            <div className="space-y-4">
                                <img
                                    src={image}
                                    alt="Uploaded"
                                    className="max-h-64 mx-auto rounded-lg border"
                                />
                                <button
                                    onClick={handleExtract}
                                    disabled={isProcessing}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        'Extract Players'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Found {extractedPlayers.length} players. Review and confirm:
                        </p>
                        <div className="max-h-96 overflow-y-auto border rounded-lg">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Number</th>
                                        <th className="px-4 py-2 text-left">Name</th>
                                        <th className="px-4 py-2 text-left">Handedness</th>
                                        <th className="px-4 py-2 text-left">Position</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {extractedPlayers.map((player, idx) => (
                                        <tr key={idx} className="border-t">
                                            <td className="px-4 py-2">{player.number}</td>
                                            <td className="px-4 py-2">{player.name}</td>
                                            <td className="px-4 py-2">{player.handedness || '-'}</td>
                                            <td className="px-4 py-2">
                                                {player.isGoalkeeper ? 'Goalkeeper' : 'Player'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setExtractedPlayers([])}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Import {extractedPlayers.length} Players
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

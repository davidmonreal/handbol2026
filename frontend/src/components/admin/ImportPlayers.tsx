import { useState, useEffect } from 'react';
import { Upload, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { TeamSelector } from './import/TeamSelector';
import { PlayerCard } from './import/PlayerCard';
import { MergeComparisonRow } from './import/MergeComparisonRow';

interface ExtractedPlayer {
    name: string;
    number: number;
    handedness?: 'left' | 'right' | 'both';
    isGoalkeeper?: boolean;
}

interface Team {
    id: string;
    name: string;
    club: {
        name: string;
    };
    category: string;
}

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

export const ImportPlayers = () => {
    const navigate = useNavigate();
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedPlayers, setExtractedPlayers] = useState<ExtractedPlayer[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // New state for duplicate detection
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [duplicates, setDuplicates] = useState<Map<number, DuplicateInfo>>(new Map());
    const [duplicateActions, setDuplicateActions] = useState<Map<number, 'merge' | 'skip' | 'keep'>>(new Map());
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
    const [mergeChoices, setMergeChoices] = useState<Map<number, Map<string, 'existing' | 'new'>>>(new Map());

    // Fetch teams on mount
    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams`);
            if (response.ok) {
                const data = await response.json();
                setTeams(data);
            }
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        }
    };

    // Check for duplicates when team is selected and players are extracted
    useEffect(() => {
        if (selectedTeamId && extractedPlayers.length > 0) {
            checkDuplicates();
        }
    }, [selectedTeamId, extractedPlayers]);

    const checkDuplicates = async () => {
        setIsCheckingDuplicates(true);
        try {
            const names = extractedPlayers.map(p => p.name);
            const response = await fetch(`${API_BASE_URL}/api/players/check-duplicates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ names, threshold: 3 }),
            });

            if (response.ok) {
                const data = await response.json();
                const duplicatesMap = new Map<number, DuplicateInfo>();
                data.duplicates.forEach((dup: DuplicateInfo, index: number) => {
                    if (dup.hasDuplicates) {
                        duplicatesMap.set(index, dup);
                    }
                });
                setDuplicates(duplicatesMap);
            }
        } catch (err) {
            console.error('Failed to check duplicates:', err);
        } finally {
            setIsCheckingDuplicates(false);
        }
    };

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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        } else {
            setError('Please drop a valid image file');
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const items = e.clipboardData?.items;

        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImage(reader.result as string);
                        setError(null);
                    };
                    reader.readAsDataURL(file);
                }
                break;
            }
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

    const handleEditPlayer = (index: number, field: keyof ExtractedPlayer, value: any) => {
        const updatedPlayers = [...extractedPlayers];
        updatedPlayers[index] = { ...updatedPlayers[index], [field]: value };
        setExtractedPlayers(updatedPlayers);
    };

    const handleRemovePlayer = (index: number) => {
        setExtractedPlayers(extractedPlayers.filter((_, i) => i !== index));
    };

    const handleConfirmImport = async () => {
        if (!selectedTeamId) {
            setError('Please select a team before importing');
            return;
        }

        // Check if all duplicates are resolved
        const unresolvedDuplicates: number[] = [];
        duplicates.forEach((_, index) => {
            if (!duplicateActions.has(index)) {
                unresolvedDuplicates.push(index);
            }
        });

        if (unresolvedDuplicates.length > 0) {
            setError(`Please resolve all duplicates before importing (${unresolvedDuplicates.length} unresolved)`);
            return;
        }

        try {
            setIsProcessing(true);
            setError(null);

            let mergedCount = 0;
            let skippedCount = 0;

            // Process merges first
            for (const [index, action] of duplicateActions.entries()) {
                if (action === 'merge') {
                    const player = extractedPlayers[index];
                    const duplicate = duplicates.get(index);
                    if (duplicate && duplicate.matches.length > 0) {
                        const matchToMerge = duplicate.matches[0]; // Merge with first match

                        await fetch(`${API_BASE_URL}/api/players/merge`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                oldPlayerId: matchToMerge.id,
                                newPlayerData: {
                                    name: player.name,
                                    number: player.number,
                                    handedness: player.handedness,
                                    isGoalkeeper: player.isGoalkeeper,
                                },
                                teamId: selectedTeamId,
                            }),
                        });
                        mergedCount++;
                    }
                } else if (action === 'skip') {
                    skippedCount++;
                }
            }

            // Get players to import (not skipped or merged)
            const playersToImport = extractedPlayers.filter((_, index) => {
                const action = duplicateActions.get(index);
                return action !== 'skip' && action !== 'merge';
            });

            // Import new players with team
            let createdCount = 0;
            if (playersToImport.length > 0) {
                const response = await fetch(`${API_BASE_URL}/api/players/batch-with-team`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        players: playersToImport,
                        teamId: selectedTeamId,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to import players');
                }

                const data = await response.json();
                createdCount = data.created || 0;
            }

            // Show success message
            const summary = [];
            if (createdCount > 0) summary.push(`${createdCount} created`);
            if (mergedCount > 0) summary.push(`${mergedCount} merged`);
            if (skippedCount > 0) summary.push(`${skippedCount} skipped`);

            alert(`✅ Import complete!\n${summary.join(', ')}`);
            navigate('/players');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import players');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/players')}
                    className="text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Import Players from Image</h1>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}


            {/* TOP SECTION: Upload and Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Upload Area */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Upload Image</h2>

                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onPaste={handlePaste}
                        tabIndex={0}
                    >
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
                                Click to upload, drag and drop, or paste<br />
                                PNG, JPG up to 10MB
                            </p>
                        </label>
                    </div>

                    {image && (
                        <button
                            onClick={handleExtract}
                            disabled={isProcessing}
                            className="w-full mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
                    )}
                </div>

                {/* Image Preview */}
                {image && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Preview</h2>
                        <img src={image} alt="Preview" className="w-full rounded-lg border" />
                    </div>
                )}
            </div>

            {/* BOTTOM SECTION: Extracted Players (Full Width) */}
            {extractedPlayers.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">
                            Extracted Players ({extractedPlayers.length})
                        </h2>
                        <button
                            onClick={() => {
                                setExtractedPlayers([]);
                                setDuplicates(new Map());
                                setDuplicateActions(new Map());
                                setMergeChoices(new Map());
                            }}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Clear all
                        </button>
                    </div>

                    <TeamSelector
                        teams={teams}
                        selectedTeamId={selectedTeamId}
                        onTeamChange={setSelectedTeamId}
                        isCheckingDuplicates={isCheckingDuplicates}
                    />

                    <div className="mt-6 space-y-4">
                        {extractedPlayers.map((player, index) => {
                            const duplicate = duplicates.get(index);
                            const action = duplicateActions.get(index);
                            const playerMergeChoices = mergeChoices.get(index) || new Map();

                            // If there's a duplicate and action is merge, show comparison
                            if (duplicate && duplicate.hasDuplicates && action === 'merge') {
                                return (
                                    <MergeComparisonRow
                                        key={index}
                                        newPlayer={player}
                                        existingPlayer={duplicate.matches[0]}
                                        playerIndex={index}
                                        action={action}
                                        mergeChoices={playerMergeChoices}
                                        onActionChange={(newAction) => {
                                            const newActions = new Map(duplicateActions);
                                            newActions.set(index, newAction);
                                            setDuplicateActions(newActions);
                                        }}
                                        onFieldChoiceChange={(field, choice) => {
                                            const newMergeChoices = new Map(mergeChoices);
                                            const playerChoices = new Map(playerMergeChoices);
                                            playerChoices.set(field, choice);
                                            newMergeChoices.set(index, playerChoices);
                                            setMergeChoices(newMergeChoices);
                                        }}
                                    />
                                );
                            }

                            // Otherwise show regular player card
                            return (
                                <PlayerCard
                                    key={index}
                                    player={player}
                                    index={index}
                                    isEditing={editingIndex === index}
                                    duplicate={duplicate}
                                    duplicateAction={action}
                                    onEdit={setEditingIndex}
                                    onSave={() => setEditingIndex(null)}
                                    onRemove={handleRemovePlayer}
                                    onFieldChange={handleEditPlayer}
                                    onDuplicateActionChange={(newAction) => {
                                        const newActions = new Map(duplicateActions);
                                        newActions.set(index, newAction);
                                        setDuplicateActions(newActions);

                                        // Initialize merge choices with defaults when selecting merge
                                        if (newAction === 'merge' && duplicate && duplicate.matches[0]) {
                                            const defaultChoices = new Map<string, 'existing' | 'new'>();
                                            defaultChoices.set('name', 'existing');
                                            defaultChoices.set('number', 'existing');
                                            defaultChoices.set('handedness', 'existing');
                                            defaultChoices.set('isGoalkeeper', 'existing');
                                            const newMergeChoices = new Map(mergeChoices);
                                            newMergeChoices.set(index, defaultChoices);
                                            setMergeChoices(newMergeChoices);
                                        }
                                    }}
                                />
                            );
                        })}
                    </div>

                    <button
                        onClick={handleConfirmImport}
                        disabled={!selectedTeamId || isProcessing || (duplicates.size > 0 && duplicates.size !== duplicateActions.size)}
                        className="w-full mt-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Importing...' : !selectedTeamId ? 'Select Team First' :
                            (duplicates.size > 0 && duplicates.size !== duplicateActions.size) ?
                                `Resolve ${duplicates.size - duplicateActions.size} Duplicates` :
                                `Import ${extractedPlayers.filter((_, i) => duplicateActions.get(i) !== 'skip').length} Players`}
                    </button>
                </div>
            )}
        </div>
    );
};


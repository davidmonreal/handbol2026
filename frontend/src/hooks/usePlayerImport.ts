import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { playerImportService } from '../services/playerImportService';
import type { ExtractedPlayer, DuplicateInfo } from '../services/playerImportService';
import type { Team } from '../types';

export const usePlayerImport = () => {
    const location = useLocation();
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedPlayers, setExtractedPlayers] = useState<ExtractedPlayer[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Duplicate detection state
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [duplicates, setDuplicates] = useState<Map<number, DuplicateInfo>>(new Map());
    const [duplicateActions, setDuplicateActions] = useState<Map<number, 'merge' | 'skip' | 'keep'>>(new Map());
    const [reviewingDuplicates, setReviewingDuplicates] = useState<Map<number, boolean>>(new Map());
    const [resolvedDuplicates, setResolvedDuplicates] = useState<Set<number>>(new Set());
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
    const [mergeChoices, setMergeChoices] = useState<Map<number, Map<string, 'existing' | 'new'>>>(new Map());

    useEffect(() => {
        loadTeams();
        // Handle pre-selection from navigation state
        if (location.state?.preselectedTeamId) {
            setSelectedTeamId(location.state.preselectedTeamId);
        }
    }, [location.state]);

    useEffect(() => {
        if (selectedTeamId && extractedPlayers.length > 0) {
            checkDuplicates();
        }
    }, [selectedTeamId, extractedPlayers]);

    const loadTeams = async () => {
        try {
            const data = await playerImportService.fetchTeams();
            setTeams(data);
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        }
    };

    const checkDuplicates = async () => {
        setIsCheckingDuplicates(true);
        try {
            const names = extractedPlayers.map(p => p.name);
            const data = await playerImportService.checkDuplicates(names);

            const duplicatesMap = new Map<number, DuplicateInfo>();
            data.duplicates.forEach((dup: DuplicateInfo, index: number) => {
                if (dup.hasDuplicates) {
                    duplicatesMap.set(index, dup);
                }
            });
            setDuplicates(duplicatesMap);
        } catch (err) {
            console.error('Failed to check duplicates:', err);
        } finally {
            setIsCheckingDuplicates(false);
        }
    };

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleExtract = async () => {
        if (!image) return;
        setIsProcessing(true);
        setError(null);
        try {
            const data = await playerImportService.extractPlayersFromImage(image);
            setExtractedPlayers(data.players);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdatePlayer = (index: number, updatedPlayer: ExtractedPlayer) => {
        const newPlayers = [...extractedPlayers];
        newPlayers[index] = updatedPlayer;
        setExtractedPlayers(newPlayers);
    };

    const handleRemovePlayer = (indexToRemove: number) => {
        // 1. Shift Duplicates Map
        const newDuplicates = new Map<number, DuplicateInfo>();
        duplicates.forEach((value, key) => {
            if (key < indexToRemove) {
                newDuplicates.set(key, value);
            } else if (key > indexToRemove) {
                newDuplicates.set(key - 1, value);
            }
        });
        setDuplicates(newDuplicates);

        // 2. Shift Duplicate Actions Map
        const newActions = new Map<number, 'merge' | 'skip' | 'keep'>();
        duplicateActions.forEach((value, key) => {
            if (key < indexToRemove) {
                newActions.set(key, value);
            } else if (key > indexToRemove) {
                newActions.set(key - 1, value);
            }
        });
        setDuplicateActions(newActions);

        // 3. Shift Reviewing Duplicates Map
        const newReviewing = new Map<number, boolean>();
        reviewingDuplicates.forEach((value, key) => {
            if (key < indexToRemove) {
                newReviewing.set(key, value);
            } else if (key > indexToRemove) {
                newReviewing.set(key - 1, value);
            }
        });
        setReviewingDuplicates(newReviewing);

        // 4. Shift Merge Choices
        const newMergeChoices = new Map<number, Map<string, 'existing' | 'new'>>();
        mergeChoices.forEach((value, key) => {
            if (key < indexToRemove) {
                newMergeChoices.set(key, value);
            } else if (key > indexToRemove) {
                newMergeChoices.set(key - 1, value);
            }
        });
        setMergeChoices(newMergeChoices);

        // 5. Shift Resolved Duplicates Set
        const newResolved = new Set<number>();
        resolvedDuplicates.forEach((val) => {
            if (val < indexToRemove) {
                newResolved.add(val);
            } else if (val > indexToRemove) {
                newResolved.add(val - 1);
            }
        });
        setResolvedDuplicates(newResolved);

        // 6. Remove from Array
        setExtractedPlayers(extractedPlayers.filter((_, i) => i !== indexToRemove));
    };

    const handleClearAll = () => {
        setExtractedPlayers([]);
        setDuplicates(new Map());
        setDuplicateActions(new Map());
        setMergeChoices(new Map());
        setResolvedDuplicates(new Set());
        setReviewingDuplicates(new Map());
    };

    // Duplicate Review Actions
    const handleReviewDuplicate = (index: number) => {
        const newReviewing = new Map(reviewingDuplicates);
        newReviewing.set(index, true);
        setReviewingDuplicates(newReviewing);

        // Initialize choices if not present
        if (!mergeChoices.has(index)) {
            const initialChoices = new Map<string, 'existing' | 'new'>();
            initialChoices.set('name', 'existing');
            initialChoices.set('number', 'existing');
            initialChoices.set('handedness', 'existing');
            initialChoices.set('isGoalkeeper', 'existing');
            initialChoices.set('position', 'existing');
            const newMergeChoices = new Map(mergeChoices);
            newMergeChoices.set(index, initialChoices);
            setMergeChoices(newMergeChoices);
        }

        // Initialize action if not present
        if (!duplicateActions.has(index)) {
            const newActions = new Map(duplicateActions);
            newActions.set(index, 'merge');
            setDuplicateActions(newActions);
        }
    };

    const handleUndoDuplicateAction = (index: number) => {
        const newActions = new Map(duplicateActions);
        newActions.delete(index);
        setDuplicateActions(newActions);

        // Re-enter review mode
        const newReviewing = new Map(reviewingDuplicates);
        newReviewing.set(index, true);
        setReviewingDuplicates(newReviewing);
    };

    const handleActionChange = (index: number, action: 'merge' | 'skip' | 'keep') => {
        const newActions = new Map(duplicateActions);
        newActions.set(index, action);
        setDuplicateActions(newActions);

        if (action === 'skip' || action === 'keep') {
            const newReviewing = new Map(reviewingDuplicates);
            newReviewing.set(index, false);
            setReviewingDuplicates(newReviewing);
        }
    };

    const handleFieldChoiceChange = (index: number, field: string, choice: 'existing' | 'new') => {
        const newMergeChoices = new Map(mergeChoices);
        const playerChoices = new Map(mergeChoices.get(index) || new Map());
        playerChoices.set(field, choice);
        newMergeChoices.set(index, playerChoices);
        setMergeChoices(newMergeChoices);
    };

    const handleConfirmMerge = (index: number) => {
        const choices = mergeChoices.get(index);
        const duplicate = duplicates.get(index);

        if (choices && duplicate && duplicate.matches[0]) {
            const existing = duplicate.matches[0];
            const newExtractedPlayers = [...extractedPlayers];
            const existingTeamPosition = selectedTeamId
                ? existing.teams?.find((team) => team.id === selectedTeamId)?.position
                : undefined;

            if (choices.get('name') === 'existing') newExtractedPlayers[index].name = existing.name;
            if (choices.get('number') === 'existing') newExtractedPlayers[index].number = existing.number;
            if (choices.get('handedness') === 'existing' && existing.handedness) newExtractedPlayers[index].handedness = existing.handedness;
            if (choices.get('isGoalkeeper') === 'existing' && existing.isGoalkeeper !== undefined) newExtractedPlayers[index].isGoalkeeper = existing.isGoalkeeper;
            if (choices.get('position') === 'existing') newExtractedPlayers[index].position = existingTeamPosition;

            setExtractedPlayers(newExtractedPlayers);

            const newResolved = new Set(resolvedDuplicates);
            newResolved.add(index);
            setResolvedDuplicates(newResolved);

            const newReviewing = new Map(reviewingDuplicates);
            newReviewing.set(index, false);
            setReviewingDuplicates(newReviewing);
        }
    };

    const handleConfirmImport = async (onSuccess: (summary: string[], totalImported: number) => void) => {
        if (!selectedTeamId) {
            setError('Please select a team before importing');
            return;
        }

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

            // Process merges
            for (const [index, action] of duplicateActions.entries()) {
                if (action === 'merge') {
                    const player = extractedPlayers[index];
                    const duplicate = duplicates.get(index);
                    if (duplicate && duplicate.matches.length > 0) {
                        await playerImportService.mergePlayer(duplicate.matches[0].id, player, selectedTeamId);
                        mergedCount++;
                    }
                } else if (action === 'skip') {
                    skippedCount++;
                }
            }

            // Process new imports
            const playersToImport = extractedPlayers.filter((_, index) => {
                const action = duplicateActions.get(index);
                return action !== 'skip' && action !== 'merge';
            });

            let createdCount = 0;
            if (playersToImport.length > 0) {
                const data = await playerImportService.importPlayersBatch(playersToImport, selectedTeamId);
                createdCount = data.created || 0;
            }

            const summary = [];
            if (createdCount > 0) summary.push(`${createdCount} created`);
            if (mergedCount > 0) summary.push(`${mergedCount} merged`);
            if (skippedCount > 0) summary.push(`${skippedCount} skipped`);

            onSuccess(summary, createdCount + mergedCount);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import players');
        } finally {
            setIsProcessing(false);
        }
    };

    // Team Creation Logic
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    // Edit Player Logic
    const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);

    const handleEditClick = (index: number) => {
        setEditingPlayerIndex(index);
    };

    const handleSaveEditedPlayer = (updatedPlayer: ExtractedPlayer) => {
        if (editingPlayerIndex !== null) {
            handleUpdatePlayer(editingPlayerIndex, updatedPlayer);
            setEditingPlayerIndex(null);
        }
    };

    const handleCreateTeam = (teamName: string) => {
        setNewTeamName(teamName);
        setIsCreateTeamModalOpen(true);
    };

    const handleSubmitCreateTeam = async (data: { clubName: string; teamName: string; category: string }) => {
        try {
            const newTeam = await playerImportService.createTeam(data.clubName, data.teamName, data.category);

            // Refresh teams list
            const teamsData = await playerImportService.fetchTeams();
            setTeams(teamsData);

            // Select the new team
            setSelectedTeamId(newTeam.id);

            return Promise.resolve();
        } catch (error) {
            console.error('Failed to create team:', error);
            return Promise.reject(error);
        }
    };

    return {
        state: {
            image,
            isProcessing,
            extractedPlayers,
            error,
            teams,
            selectedTeamId,
            duplicates,
            duplicateActions,
            reviewingDuplicates,
            resolvedDuplicates,
            isCheckingDuplicates,
            mergeChoices,
            // Team Creation
            isCreateTeamModalOpen,
            newTeamName,
            // Edit Player
            editingPlayerIndex,
        },
        actions: {
            setImage,
            setError,
            setSelectedTeamId,
            handleImageUpload,
            handleExtract,
            handleUpdatePlayer,
            handleRemovePlayer,
            handleClearAll,
            handleReviewDuplicate,
            handleUndoDuplicateAction,
            handleActionChange,
            handleFieldChoiceChange,
            handleConfirmMerge,
            handleConfirmImport,
            // Team Creation
            setIsCreateTeamModalOpen,
            handleCreateTeam,
            handleSubmitCreateTeam,
            // Edit Player
            handleEditClick,
            handleSaveEditedPlayer,
            handleCancelEdit: () => setEditingPlayerIndex(null),
        }
    };
};

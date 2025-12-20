
import { useState, useMemo, useRef } from 'react';
import {
    User,
    Users,
    ArrowUp,
    ArrowLeftRight,
} from 'lucide-react';
import type { MatchEvent, ZoneType, TurnoverType, SanctionType } from '../../../types';
import { ZoneSelector } from '../shared/ZoneSelector';
import { SplitToggle } from '../shared/SplitToggle';
import { ConfirmationModal } from '../../common';
import { useSafeTranslation } from '../../../context/LanguageContext';
import { buildEventFromForm } from './eventFormBuilder';
import {
    buildShotResults,
    buildTurnoverTypes,
    buildSanctionTypes,
    ShotResultSelector,
    TurnoverSelector,
    SanctionSelector,
} from './ActionSelectors';

// Define interfaces locally to match MatchContext structure
interface Player {
    id: string;
    number: number;
    name: string;
    position: string;
    isGoalkeeper?: boolean;
}

interface Team {
    id: string;
    name: string;
    color: string;
    players: Player[];
}

interface EventFormProps {
    event?: MatchEvent | null; // Optional for creation mode
    team: Team;
    opponentTeam?: Team; // For GK selection
    initialState?: {
        playerId?: string;
        opponentGoalkeeperId?: string;
    };
    onSave: (event: MatchEvent, opponentGkId?: string) => void;
    onSaved?: () => void;
    onSaveMessage?: (message: string, variant?: 'success' | 'error') => void;
    onCancel: () => void;
    onDelete?: (eventId: string) => void;
    locked?: boolean;
}

export const EventForm = ({
    event = null,
    team,
    opponentTeam,
    initialState,
    onSave,
    onSaved,
    onSaveMessage,
    onCancel,
    onDelete,
    locked = false
}: EventFormProps) => {
    const { t } = useSafeTranslation();

    // State initialization
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
        event?.playerId || initialState?.playerId || ''
    );
    // Opponent Goalkeeper State
    const [selectedOpponentGkId, setSelectedOpponentGkId] = useState<string>(
        initialState?.opponentGoalkeeperId || ''
    );

    const [selectedCategory, setSelectedCategory] = useState<string>(event?.category || 'Shot');
    const [selectedAction, setSelectedAction] = useState<string | null>(event?.action || null);
    const [selectedZone, setSelectedZone] = useState<ZoneType | null>(event?.zone || null);
    const [selectedTarget, setSelectedTarget] = useState<number | undefined>(event?.goalTarget);
    const [isCollective, setIsCollective] = useState(event?.isCollective ?? true);
    const [hasOpposition, setHasOpposition] = useState(event?.hasOpposition || false);
    const [isCounterAttack, setIsCounterAttack] = useState(event?.isCounterAttack || false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    // Constants
    const shotResults = useMemo(() => buildShotResults(t), [t]);
    const turnoverTypes = useMemo(() => buildTurnoverTypes(t), [t]);
    const sanctionTypes = useMemo(() => buildSanctionTypes(t), [t]);

    // Handlers
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setSelectedAction(category === 'Sanction' ? 'Foul' : null);
        setSelectedTarget(undefined);
        if (category === 'Sanction') {
            // Fouls always happen with opposition.
            setHasOpposition(true);
        }
    };

    const handleHasOppositionChange = (value: boolean) => {
        const mustHaveOpposition =
            (selectedCategory === 'Sanction' && selectedAction === 'Foul') ||
            (selectedCategory === 'Turnover' && selectedAction === 'Offensive Foul');
        setHasOpposition(mustHaveOpposition ? true : value);
    };

    const handleIsCollectiveChange = (value: boolean) => {
        const mustBeCollective = selectedCategory === 'Turnover' && selectedAction === 'Pass';
        setIsCollective(mustBeCollective ? true : value);
    };

    const handleSave = async () => {
        if (locked) return;
        if (!selectedPlayerId) return;

        // Movem la lògica de mapping a un helper pur per poder-la testar i mantenir la UI neta.
        const updatedEvent: MatchEvent = buildEventFromForm({
            teamId: team.id,
            selectedPlayerId,
            selectedCategory,
            selectedAction,
            selectedZone,
            selectedTarget,
            isCollective,
            hasOpposition,
            isCounterAttack,
            opponentGoalkeeperId: selectedOpponentGkId || undefined,
        }, { baseEvent: event || null });

        try {
            await Promise.resolve(onSave(updatedEvent, selectedOpponentGkId));
            onSaveMessage?.(t('eventForm.successMessage'), 'success');
            onSaved?.();
        } catch (err) {
            onSaveMessage?.(
                err instanceof Error ? err.message : t('dashboard.errorLoadMatches'),
                'error',
            );
        }

        // After saving a new play we reset to the most common configuration (Shot + Collective + Free + Static)
        setSelectedCategory('Shot');
        setIsCollective(true);
        setHasOpposition(false);
        setIsCounterAttack(false);

        if (!event) {
            setSelectedAction(null);
            setSelectedZone(null);
            setSelectedTarget(undefined);
            setSelectedPlayerId('');
        }
    };

    const handleDelete = () => {
        if (locked) return;
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = () => {
        setShowDeleteConfirmation(false);
        if (event && onDelete) {
            onDelete(event.id);
            onCancel();
        }
    };

    const sortedPlayers = [...team.players].sort((a, b) => a.number - b.number);
    const opponentGoalkeepers = opponentTeam?.players.filter(p => p.isGoalkeeper) || [];
    const isPlayerSelected = !!selectedPlayerId;
    const lockClass = locked ? 'opacity-50 pointer-events-none' : '';

    const categoryRef = useRef<HTMLDivElement>(null);
    const formTopRef = useRef<HTMLDivElement>(null);

    const handlePlayerSelect = (playerId: string) => {
        setSelectedPlayerId(playerId);
        setTimeout(() => {
            categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    return (
        <div ref={formTopRef} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-6 relative">
            {locked && (
                <div className="absolute inset-0 bg-white/40 rounded-lg pointer-events-none" aria-hidden />
            )}

            {/* Top Row: Opponent GK & Players */}
            <div className={`space-y-4 ${lockClass}`}>

                {/* 1. Opponent GK (Badges) */}
                <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('eventForm.opponentGk')}</div>
                            {!selectedOpponentGkId && <span className="text-xs text-orange-600 font-medium animate-pulse">{t('eventForm.selectGk')}</span>}
                        </div>

                    {opponentGoalkeepers.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {opponentGoalkeepers.map(gk => {
                                const nameParts = gk.name.split(' ');
                                const shortName = nameParts.length > 1
                                    ? `${nameParts[0]} ${nameParts[1][0]}.`
                                    : gk.name;

                                return (
                                    <button
                                        key={gk.id}
                                        onClick={() => setSelectedOpponentGkId(gk.id)}
                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${selectedOpponentGkId === gk.id
                                            ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                                            }`}
                                    >
                                        <span className={`flex items-center justify-center w-6 h-6 rounded text-sm font-bold ${selectedOpponentGkId === gk.id ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                            {gk.number}
                                        </span>
                                        <span className={`text-xs font-semibold truncate ${selectedOpponentGkId === gk.id ? 'text-orange-50' : 'text-gray-600'}`}>
                                            {shortName}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-400 italic">{t('eventForm.noGoalkeepers')}</div>
                    )}
                </div>

                {/* 2. Players Grid */}
                <div className="relative">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('eventForm.selectPlayer')}</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {sortedPlayers.map(player => {
                            const nameParts = player.name.split(' ');
                            const displayName =
                                nameParts.length >= 2
                                    ? `${nameParts[0]} ${nameParts[1]}`
                                    : player.name;
                            const isSelected = selectedPlayerId === player.id;
                            const isGoalkeeper = player.isGoalkeeper;
                            // Goalkeepers stand out with the same orange styling used in the opponent GK pills
                            const buttonClass = isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50';

                            return (
                                <button
                                    key={player.id}
                                    onClick={() => handlePlayerSelect(player.id)}
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${buttonClass}`}
                                >
                                    <span className={`flex items-center justify-center w-6 h-6 rounded text-sm font-bold ${
                                        isSelected
                                            ? 'bg-white/20 text-white'
                                            : isGoalkeeper
                                                ? 'bg-orange-100 text-orange-800'
                                                : 'bg-gray-100 text-gray-900'
                                    }`}>
                                        {player.number}
                                    </span>
                                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-50' : 'text-gray-600'}`}>
                                        {displayName}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Category Selection */}
            <div className={lockClass} ref={categoryRef}>
                <div className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('eventForm.category')}</div>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { value: 'Shot', label: t('eventForm.categoryShot') },
                        { value: 'Sanction', label: t('eventForm.categoryFoul') },
                        { value: 'Turnover', label: t('eventForm.categoryTurnover') },
                    ].map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => handleCategoryChange(cat.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat.value
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={isPlayerSelected ? `space-y-6 ${lockClass}` : `space-y-6 opacity-50 pointer-events-none ${lockClass}`}>
                {/* 4. Action Selection */}
                <div className={lockClass}>
                    <div className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {selectedCategory === 'Shot'
                            ? t('eventForm.resultLabel')
                            : selectedCategory === 'Turnover'
                                ? t('eventForm.typeLabel')
                                : t('eventForm.severityLabel')}
                    </div>

                    {selectedCategory === 'Shot' && (
                        <ShotResultSelector
                            selectedAction={selectedAction}
                            results={shotResults}
                            onSelect={setSelectedAction}
                        />
                    )}

                    {selectedCategory === 'Turnover' && (
                        <TurnoverSelector
                            selectedAction={selectedAction}
                            types={turnoverTypes}
                            onSelect={setSelectedAction as (value: TurnoverType) => void}
                            onForceCollective={() => handleIsCollectiveChange(true)}
                            onForceOpposition={() => handleHasOppositionChange(true)}
                        />
                    )}

                    {selectedCategory === 'Sanction' && (
                        <SanctionSelector
                            selectedAction={selectedAction}
                            sanctions={sanctionTypes}
                            onSelect={setSelectedAction as (value: SanctionType) => void}
                            onForceOpposition={() => handleHasOppositionChange(true)}
                        />
                    )}
                </div>

                {/* 5. Goal Target (Only for Goal/Save) */}
                {/* Shot flow always shows the goal until the user explicitly selects an outcome that doesn't need it */}
                {(selectedCategory === 'Shot' && !['Miss', 'Post', 'Block'].includes(selectedAction || '')) && (
                    <div className="animate-fade-in bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-500 mb-3 text-center">
                            {selectedAction === 'Goal'
                                ? t('eventForm.goalTargetTitle')
                                : t('eventForm.saveLocationTitle')}
                        </h4>
                        <div className="max-w-[220px] mx-auto bg-white rounded-xl p-2 border border-gray-200 shadow-sm">
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((target) => {
                                    const isActive = selectedTarget === target;
                                    return (
                                        <button
                                            key={target}
                                            aria-label={`goal-target-${target}`}
                                            aria-pressed={isActive}
                                            onClick={() => setSelectedTarget(target)}
                                            className={`h-14 rounded-lg transition-all border-2 flex items-center justify-center ${isActive
                                                ? 'bg-indigo-600 border-indigo-600 shadow-sm'
                                                : 'bg-white border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                                                }`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. Zone Selection */}
                <div className={lockClass}>
                    <div className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('eventForm.selectZone')}</div>
                    <ZoneSelector
                        selectedZone={selectedZone}
                        onZoneSelect={(zone) => {
                            setSelectedZone(zone);
                            if (selectedCategory === 'Shot' && zone === '7m') {
                                // Penalty shots are individual, free, and static by definition.
                                setIsCollective(false);
                                setHasOpposition(false);
                                setIsCounterAttack(false);
                            }
                        }}
                        variant="minimal"
                    />
                </div>

                {/* 7. Context Toggles (Shots, Fouls, Turnovers) */}
                {(selectedCategory === 'Shot' || selectedCategory === 'Sanction' || selectedCategory === 'Turnover') && (
                    <div>
                        <div className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('eventForm.contextLabel')}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <SplitToggle
                                value={isCollective}
                                onChange={handleIsCollectiveChange}
                                leftOption={{ label: t('eventForm.context.individual'), icon: User }}
                                rightOption={{ label: t('eventForm.context.collective'), icon: Users }}
                            />
                            <SplitToggle
                                value={hasOpposition}
                                onChange={handleHasOppositionChange}
                                leftOption={{ label: t('eventForm.context.free'), icon: User }}
                                rightOption={{ label: t('eventForm.context.opposition'), icon: [User, Users] }}
                            />
                            <SplitToggle
                                value={isCounterAttack}
                                onChange={setIsCounterAttack}
                                leftOption={{ label: t('eventForm.context.static'), icon: ArrowLeftRight }}
                                rightOption={{ label: t('eventForm.context.counter'), icon: ArrowUp }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className={`flex items-center justify-between gap-3 pt-3 border-t border-gray-300 flex-wrap ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex items-center gap-3 flex-wrap">
                    {event && (
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 font-medium transition-colors disabled:text-gray-300 disabled:hover:text-gray-300"
                            disabled={locked}
                            data-testid="delete-event-button"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {t('eventForm.deleteButton')}
                        </button>
                    )}
                </div>

                <div className="flex gap-2 items-center flex-wrap justify-end">
                    <button
                        onClick={() => { if (!locked) onCancel(); }}
                        disabled={locked}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:text-gray-400 disabled:border-gray-200 disabled:hover:bg-white"
                    >
                        {t('eventForm.cancelButton')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
                        disabled={!isPlayerSelected || locked}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {event ? t('eventForm.saveChanges') : t('eventForm.addEvent')}
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirmation}
                title={t('eventForm.deleteTitle')}
                message={t('eventForm.deleteMessage')}
                confirmLabel={t('eventForm.deleteButton')}
                cancelLabel={t('eventForm.cancelButton')}
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirmation(false)}
            />
        </div>
    );
};

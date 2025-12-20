
import { useRef } from 'react';
import {
    User,
    Users,
    ArrowUp,
    ArrowLeftRight,
} from 'lucide-react';
import type { MatchEvent, TurnoverType, SanctionType } from '../../../types';
import type { EventCategory } from './eventFormStateMachine';
import { ZoneSelector } from '../shared/ZoneSelector';
import { SplitToggle } from '../shared/SplitToggle';
import { ConfirmationModal } from '../../common';
import { useSafeTranslation } from '../../../context/LanguageContext';
import { ShotResultSelector, TurnoverSelector, SanctionSelector } from './ActionSelectors';
import { useEventFormState } from './useEventFormState';

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

    const {
        state,
        shotResults,
        turnoverTypes,
        sanctionTypes,
        isGoalTargetVisible,
        dispatchers,
    } = useEventFormState({
        event,
        teamId: team.id,
        initialState,
        locked,
        onSave,
        onSaved,
        onSaveMessage,
        onCancel,
        onDelete,
        t,
    });

    const {
        selectedPlayerId,
        selectedOpponentGkId,
        selectedCategory,
        selectedAction,
        selectedZone,
        selectedTarget,
        isCollective,
        hasOpposition,
        isCounterAttack,
        showDeleteConfirmation,
    } = state;

    const {
        selectPlayer,
        selectOpponentGk,
        selectCategory,
        selectAction,
        selectZone,
        selectTarget,
        toggleCollective,
        toggleOpposition,
        toggleCounterAttack,
        save,
        requestDelete,
        confirmDelete,
        cancelDelete,
    } = dispatchers;

    const sortedPlayers = [...team.players].sort((a, b) => a.number - b.number);
    const opponentGoalkeepers = opponentTeam?.players.filter(p => p.isGoalkeeper) || [];
    const isPlayerSelected = !!selectedPlayerId;
    const lockClass = locked ? 'opacity-50 pointer-events-none' : '';

    const categoryRef = useRef<HTMLDivElement>(null);
    const formTopRef = useRef<HTMLDivElement>(null);

    const categories: Array<{ value: EventCategory; label: string }> = [
        { value: 'Shot', label: t('eventForm.categoryShot') },
        { value: 'Sanction', label: t('eventForm.categoryFoul') },
        { value: 'Turnover', label: t('eventForm.categoryTurnover') },
    ];

    const handlePlayerSelect = (playerId: string) => {
        selectPlayer(playerId);
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
                                        onClick={() => selectOpponentGk(gk.id)}
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
                    {categories.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => selectCategory(cat.value)}
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
                            onSelect={selectAction}
                        />
                    )}

                    {selectedCategory === 'Turnover' && (
                        <TurnoverSelector
                            selectedAction={selectedAction}
                            types={turnoverTypes}
                            onSelect={(value: TurnoverType) => selectAction(value)}
                            onForceCollective={() => toggleCollective(true)}
                            onForceOpposition={() => toggleOpposition(true)}
                        />
                    )}

                    {selectedCategory === 'Sanction' && (
                        <SanctionSelector
                            selectedAction={selectedAction}
                            sanctions={sanctionTypes}
                            onSelect={(value: SanctionType) => selectAction(value)}
                            onForceOpposition={() => toggleOpposition(true)}
                        />
                    )}
                </div>

                {/* 5. Goal Target (Only for Goal/Save) */}
                {/* Shot flow always shows the goal until the user explicitly selects an outcome that doesn't need it */}
                {isGoalTargetVisible && (
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
                                            onClick={() => selectTarget(target)}
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
                        onZoneSelect={selectZone}
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
                                onChange={toggleCollective}
                                leftOption={{ label: t('eventForm.context.individual'), icon: User }}
                                rightOption={{ label: t('eventForm.context.collective'), icon: Users }}
                            />
                            <SplitToggle
                                value={hasOpposition}
                                onChange={toggleOpposition}
                                leftOption={{ label: t('eventForm.context.free'), icon: User }}
                                rightOption={{ label: t('eventForm.context.opposition'), icon: [User, Users] }}
                            />
                            <SplitToggle
                                value={isCounterAttack}
                                onChange={toggleCounterAttack}
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
                            onClick={requestDelete}
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
                        onClick={save}
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
                onCancel={cancelDelete}
            />
        </div>
    );
};


import { useRef } from 'react';
import type { MatchEvent, TurnoverType, SanctionType } from '../../../types';
import { ZoneSelector } from '../shared/ZoneSelector';
import { ConfirmationModal } from '../../common';
import { useSafeTranslation } from '../../../context/LanguageContext';
import { ShotResultSelector, TurnoverSelector, SanctionSelector } from './ActionSelectors';
import { useEventFormState } from './useEventFormState';
import { CategorySelector } from './components/CategorySelector';
import { OpponentGoalkeeperSelector, PlayerGrid } from './components/ParticipantSelectors';
import { GoalTargetGrid } from './components/GoalTargetGrid';
import { ContextToggles } from './components/ContextToggles';
import type { Team } from './components/types';

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
    locked = false,
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
        resetFormPreservingOpponentGk,
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

    return (
        <div ref={formTopRef} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-6 relative">
            {locked && (
                <div className="absolute inset-0 bg-white/40 rounded-lg pointer-events-none" aria-hidden />
            )}

            {/* Top Row: Opponent GK & Players */}
            <div className={`space-y-4 ${lockClass}`}>
                {/* Opponent GK selector */}
                <OpponentGoalkeeperSelector
                    opponentGoalkeepers={opponentGoalkeepers}
                    selectedOpponentGkId={selectedOpponentGkId}
                    onSelect={selectOpponentGk}
                    t={t}
                />
                {/* Player grid */}
                <PlayerGrid
                    players={sortedPlayers}
                    selectedPlayerId={selectedPlayerId}
                    onSelect={(playerId) => {
                        selectPlayer(playerId);
                        setTimeout(() => {
                            categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    }}
                    t={t}
                />
            </div>

            {/* 3. Category Selection */}
            {/* Shot / Foul / Turnover tab buttons */}
            <CategorySelector
                ref={categoryRef}
                selectedCategory={selectedCategory}
                onSelect={selectCategory}
                lockClass={lockClass}
                t={t}
            />

            <div className={isPlayerSelected ? `space-y-6 ${lockClass}` : `space-y-6 opacity-50 pointer-events-none ${lockClass}`}>
                {/* 4. Action Selection */}
                {/* Result/Type/Severity buttons per category */}
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
                    /* 3x3 goal target grid */
                    <GoalTargetGrid
                        selectedAction={selectedAction}
                        selectedTarget={selectedTarget}
                        onSelect={selectTarget}
                        t={t}
                    />
                )}

                {/* 6. Zone Selection */}
                {/* 6m/9m/7m zone buttons */}
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
                    /* Collective / Opposition / Counter toggles */
                    <ContextToggles
                        isCollective={isCollective}
                        hasOpposition={hasOpposition}
                        isCounterAttack={isCounterAttack}
                        onToggleCollective={toggleCollective}
                        onToggleOpposition={toggleOpposition}
                        onToggleCounterAttack={toggleCounterAttack}
                        t={t}
                    />
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
                        onClick={() => {
                            if (locked) return;
                            resetFormPreservingOpponentGk();
                            onCancel();
                        }}
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

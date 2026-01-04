import { useRef } from 'react';
import type { MatchEvent, TurnoverType, SanctionType, ShotResult, ZoneType } from '../../../types';
import { ZoneSelector } from '../shared/ZoneSelector';
import { ConfirmationModal } from '../../common';
import { useSafeTranslation } from '../../../context/LanguageContext';
import { ActionSelectors } from './ActionSelectors';
import { useEventFormState } from './useEventFormState';
import { CategorySelector } from './components/CategorySelector';
import { OpponentGoalkeeperSelector, PlayerGrid } from './components/ParticipantSelectors';
import { GoalTargetGrid } from './components/GoalTargetGrid';
import { ContextToggles } from './components/ContextToggles';
import type { EventFormTeam as Team } from './components/types';
import type { EventCategory } from './eventFormStateMachine';

export type EventFormController = ReturnType<typeof useEventFormState>;

type EventFormHandlers = {
    onSelectPlayer: (playerId: string) => void;
    onSelectOpponentGk: (playerId: string) => void;
    onSelectCategory: (category: EventCategory) => void;
    onSelectAction: (action: ShotResult | TurnoverType | SanctionType | null) => void;
    onSelectZone: (zone: ZoneType | null) => void;
    onSelectTarget: (target?: number) => void;
    onToggleCollective: (value: boolean) => void;
    onToggleOpposition: (value: boolean) => void;
    onToggleCounterAttack: (value: boolean) => void;
    onRequestDelete: () => void;
    onConfirmDelete: () => void;
    onCancelDelete: () => void;
    onResetAndCancel: () => void;
    onSave: () => void | Promise<void>;
};

interface EventFormProps {
    event?: MatchEvent | null; // Optional for creation mode
    team: Team;
    opponentTeam?: Team; // For GK selection
    initialState?: {
        playerId?: string;
        opponentGoalkeeperId?: string;
    };
    requireOpponentGoalkeeper?: boolean;
    onSave: (event: MatchEvent, opponentGkId?: string) => void;
    onSaved?: () => void;
    onSaveMessage?: (message: string, variant?: 'success' | 'error') => void;
    onCancel: () => void;
    onDelete?: (eventId: string) => void;
    locked?: boolean;
    controller?: EventFormController;
}

type EventFormViewProps = {
    event?: MatchEvent | null;
    team: Team;
    opponentTeam?: Team;
    locked: boolean;
    controller: EventFormController;
    handlers: EventFormHandlers;
    t: (key: string) => string;
    requireOpponentGoalkeeper: boolean;
};

type OpponentGoalkeeperSectionProps = {
    opponentGoalkeepers: Team['players'];
    selectedOpponentGkId: string | null;
    onSelect: (playerId: string) => void;
    t: (key: string) => string;
};

const OpponentGoalkeeperSection = ({
    opponentGoalkeepers,
    selectedOpponentGkId,
    onSelect,
    t,
}: OpponentGoalkeeperSectionProps) => (
    <OpponentGoalkeeperSelector
        opponentGoalkeepers={opponentGoalkeepers}
        selectedOpponentGkId={selectedOpponentGkId}
        onSelect={onSelect}
        t={t}
    />
);

type PlayerGridSectionProps = {
    players: Team['players'];
    selectedPlayerId: string | null;
    onSelect: (playerId: string) => void;
    t: (key: string) => string;
};

const PlayerGridSection = ({
    players,
    selectedPlayerId,
    onSelect,
    t,
}: PlayerGridSectionProps) => (
    <PlayerGrid players={players} selectedPlayerId={selectedPlayerId} onSelect={onSelect} t={t} />
);

type ActionSelectionSectionProps = {
    selectedCategory: EventCategory;
    selectedAction: ShotResult | TurnoverType | SanctionType | null;
    shotResults: EventFormController['shotResults'];
    turnoverTypes: EventFormController['turnoverTypes'];
    sanctionTypes: EventFormController['sanctionTypes'];
    onSelectAction: (action: ShotResult | TurnoverType | SanctionType | null) => void;
    onForceCollective: () => void;
    onForceOpposition: () => void;
    lockClass: string;
    t: (key: string) => string;
};

const ActionSelectionSection = ({
    selectedCategory,
    selectedAction,
    shotResults,
    turnoverTypes,
    sanctionTypes,
    onSelectAction,
    onForceCollective,
    onForceOpposition,
    lockClass,
    t,
}: ActionSelectionSectionProps) => (
    <div className={lockClass}>
        <div className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {selectedCategory === 'Shot'
                ? t('eventForm.resultLabel')
                : selectedCategory === 'Turnover'
                    ? t('eventForm.typeLabel')
                    : t('eventForm.severityLabel')}
        </div>

        <ActionSelectors
            selectedCategory={selectedCategory}
            selectedAction={selectedAction}
            shotResults={shotResults}
            turnoverTypes={turnoverTypes}
            sanctionTypes={sanctionTypes}
            onSelectAction={onSelectAction}
            onForceCollective={onForceCollective}
            onForceOpposition={onForceOpposition}
        />
    </div>
);

type GoalTargetSectionProps = {
    isVisible: boolean;
    selectedAction: ShotResult | TurnoverType | SanctionType | null;
    selectedTarget?: number;
    onSelectTarget: (target?: number) => void;
    t: (key: string) => string;
};

const GoalTargetSection = ({
    isVisible,
    selectedAction,
    selectedTarget,
    onSelectTarget,
    t,
}: GoalTargetSectionProps) =>
    isVisible ? (
        <GoalTargetGrid
            selectedAction={selectedAction}
            selectedTarget={selectedTarget}
            onSelect={onSelectTarget}
            t={t}
        />
    ) : null;

type ZoneSelectionSectionProps = {
    selectedZone: ZoneType | null;
    onZoneSelect: (zone: ZoneType | null) => void;
    lockClass: string;
    t: (key: string) => string;
};

const ZoneSelectionSection = ({
    selectedZone,
    onZoneSelect,
    lockClass,
    t,
}: ZoneSelectionSectionProps) => (
    <div className={lockClass}>
        <div className="hidden sm:block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t('eventForm.selectZone')}
        </div>
        <ZoneSelector selectedZone={selectedZone} onZoneSelect={onZoneSelect} variant="minimal" />
    </div>
);

type ContextToggleSectionProps = {
    selectedCategory: EventCategory;
    isCollective: boolean;
    hasOpposition: boolean;
    isCounterAttack: boolean;
    onToggleCollective: (value: boolean) => void;
    onToggleOpposition: (value: boolean) => void;
    onToggleCounterAttack: (value: boolean) => void;
    lockClass: string;
    t: (key: string) => string;
};

const ContextToggleSection = ({
    selectedCategory,
    isCollective,
    hasOpposition,
    isCounterAttack,
    onToggleCollective,
    onToggleOpposition,
    onToggleCounterAttack,
    lockClass,
    t,
}: ContextToggleSectionProps) =>
    selectedCategory === 'Shot' || selectedCategory === 'Sanction' || selectedCategory === 'Turnover'
        ? (
            <div className={lockClass}>
                <ContextToggles
                    isCollective={isCollective}
                    hasOpposition={hasOpposition}
                    isCounterAttack={isCounterAttack}
                    onToggleCollective={onToggleCollective}
                    onToggleOpposition={onToggleOpposition}
                    onToggleCounterAttack={onToggleCounterAttack}
                    t={t}
                />
            </div>
        )
        : null;

type FooterActionsSectionProps = {
    event?: MatchEvent | null;
    locked: boolean;
    isSaveDisabled: boolean;
    onCancel: () => void;
    onSave: () => void;
    onDelete?: () => void;
    t: (key: string) => string;
};

const FooterActionsSection = ({
    event,
    locked,
    isSaveDisabled,
    onCancel,
    onSave,
    onDelete,
    t,
}: FooterActionsSectionProps) => (
    <div className={`flex items-center justify-between gap-3 pt-3 border-t border-gray-300 flex-wrap ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="flex items-center gap-3 flex-wrap">
            {event && (
                <button
                    onClick={onDelete}
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
                onClick={onCancel}
                disabled={locked}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:text-gray-400 disabled:border-gray-200 disabled:hover:bg-white"
            >
                {t('eventForm.cancelButton')}
            </button>
            <button
                onClick={onSave}
                className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700"
                disabled={isSaveDisabled}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {event ? t('eventForm.saveChanges') : t('eventForm.addEvent')}
            </button>
        </div>
    </div>
);

export const EventForm = ({
    event = null,
    team,
    opponentTeam,
    initialState,
    requireOpponentGoalkeeper: requireOpponentGoalkeeperProp,
    onSave,
    onSaved,
    onSaveMessage,
    onCancel,
    onDelete,
    locked = false,
    controller: injectedController,
}: EventFormProps) => {
    const { t } = useSafeTranslation();
    const requireOpponentGoalkeeper = requireOpponentGoalkeeperProp ?? true;

    const internalController = useEventFormState({
        event,
        teamId: team.id,
        initialState,
        locked,
        requireOpponentGoalkeeper,
        onSave,
        onSaved,
        onSaveMessage,
        onCancel,
        onDelete,
        t,
    });
    const controller = injectedController ?? internalController;

    const handlers: EventFormHandlers = {
        onSelectPlayer: controller.dispatchers.selectPlayer,
        onSelectOpponentGk: controller.dispatchers.selectOpponentGk,
        onSelectCategory: controller.dispatchers.selectCategory,
        onSelectAction: controller.dispatchers.selectAction,
        onSelectZone: controller.dispatchers.selectZone,
        onSelectTarget: controller.dispatchers.selectTarget,
        onToggleCollective: controller.dispatchers.toggleCollective,
        onToggleOpposition: controller.dispatchers.toggleOpposition,
        onToggleCounterAttack: controller.dispatchers.toggleCounterAttack,
        onRequestDelete: controller.dispatchers.requestDelete,
        onConfirmDelete: controller.dispatchers.confirmDelete,
        onCancelDelete: controller.dispatchers.cancelDelete,
        onResetAndCancel: () => {
            if (locked) return;
            controller.dispatchers.resetFormPreservingOpponentGk();
            onCancel();
        },
        onSave: controller.dispatchers.save,
    };

    return (
        <EventFormView
            event={event}
            team={team}
            opponentTeam={opponentTeam}
            locked={locked}
            controller={controller}
            handlers={handlers}
            t={t}
            requireOpponentGoalkeeper={requireOpponentGoalkeeper}
        />
    );
};

const EventFormView = ({
    event,
    team,
    opponentTeam,
    locked,
    controller,
    handlers,
    t,
    requireOpponentGoalkeeper,
}: EventFormViewProps) => {
    const {
        state: {
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
        },
        shotResults,
        turnoverTypes,
        sanctionTypes,
        isGoalTargetVisible,
    } = controller;

    const categoryRef = useRef<HTMLDivElement>(null);
    const formTopRef = useRef<HTMLDivElement>(null);

    const sortedPlayers = [...team.players].sort((a, b) => {
        const numA = typeof a.number === 'number' ? a.number : Number.MAX_SAFE_INTEGER;
        const numB = typeof b.number === 'number' ? b.number : Number.MAX_SAFE_INTEGER;
        return numA - numB;
    });
    const opponentGoalkeepers = opponentTeam?.players.filter(p => p.isGoalkeeper) || [];
    const isPlayerSelected = !!selectedPlayerId;
    const isOpponentGoalkeeperSelected = !!selectedOpponentGkId;
    const isSaveDisabled = locked || !isPlayerSelected || (requireOpponentGoalkeeper && !isOpponentGoalkeeperSelected);
    const lockClass = locked ? 'opacity-50 pointer-events-none' : '';

    const scrollCategoryIntoView = () => {
        setTimeout(() => {
            categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    return (
        <div ref={formTopRef} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-6 relative">
            {locked && (
                <div className="absolute inset-0 bg-white/40 rounded-lg pointer-events-none" aria-hidden />
            )}

            <div className={`space-y-4 ${lockClass}`}>
                <OpponentGoalkeeperSection
                    opponentGoalkeepers={opponentGoalkeepers}
                    selectedOpponentGkId={selectedOpponentGkId}
                    onSelect={handlers.onSelectOpponentGk}
                    t={t}
                />
                <PlayerGridSection
                    players={sortedPlayers}
                    selectedPlayerId={selectedPlayerId}
                    onSelect={(playerId) => {
                        handlers.onSelectPlayer(playerId);
                        scrollCategoryIntoView();
                    }}
                    t={t}
                />
            </div>

            <CategorySelector
                ref={categoryRef}
                selectedCategory={selectedCategory}
                onSelect={handlers.onSelectCategory}
                lockClass={lockClass}
                t={t}
            />

            <div className={isPlayerSelected ? `space-y-6 ${lockClass}` : `space-y-6 opacity-50 pointer-events-none ${lockClass}`}>
                <ActionSelectionSection
                    selectedCategory={selectedCategory}
                    selectedAction={selectedAction}
                    shotResults={shotResults}
                    turnoverTypes={turnoverTypes}
                    sanctionTypes={sanctionTypes}
                    onSelectAction={handlers.onSelectAction}
                    onForceCollective={() => handlers.onToggleCollective(true)}
                    onForceOpposition={() => handlers.onToggleOpposition(true)}
                    lockClass={lockClass}
                    t={t}
                />

                <GoalTargetSection
                    isVisible={isGoalTargetVisible}
                    selectedAction={selectedAction}
                    selectedTarget={selectedTarget}
                    onSelectTarget={handlers.onSelectTarget}
                    t={t}
                />

                <ZoneSelectionSection
                    selectedZone={selectedZone}
                    onZoneSelect={handlers.onSelectZone}
                    lockClass={lockClass}
                    t={t}
                />

                <ContextToggleSection
                    selectedCategory={selectedCategory}
                    isCollective={isCollective}
                    hasOpposition={hasOpposition}
                    isCounterAttack={isCounterAttack}
                    onToggleCollective={handlers.onToggleCollective}
                    onToggleOpposition={handlers.onToggleOpposition}
                    onToggleCounterAttack={handlers.onToggleCounterAttack}
                    lockClass={lockClass}
                    t={t}
                />
            </div>

            <FooterActionsSection
                event={event}
                locked={locked}
                isSaveDisabled={isSaveDisabled}
                onCancel={handlers.onResetAndCancel}
                onSave={handlers.onSave}
                onDelete={handlers.onRequestDelete}
                t={t}
            />

            <ConfirmationModal
                isOpen={showDeleteConfirmation}
                title={t('eventForm.deleteTitle')}
                message={t('eventForm.deleteMessage')}
                confirmLabel={t('eventForm.deleteButton')}
                cancelLabel={t('eventForm.cancelButton')}
                variant="danger"
                onConfirm={handlers.onConfirmDelete}
                onCancel={handlers.onCancelDelete}
            />
        </div>
    );
};

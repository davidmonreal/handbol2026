/**
 * Shared Event Form Section component
 * Used by both MatchTracker and VideoMatchTracker
 */
import { useRef, useEffect } from 'react';
import type { MatchEvent } from '../../../types';
import { EventForm } from '../events/EventForm';
import { useSafeTranslation } from '../../../context/LanguageContext';
import type { TransformedTeam, TransformedPlayer } from './transformTeam';
import type { SaveBanner, EventFormInitialState } from './useMatchTrackerCore';

interface EventFormSectionProps {
    editingEvent: MatchEvent | null;
    activeTeam: TransformedTeam | null;
    opponentTeam: TransformedTeam | null;
    activeTeamId: string | null;
    eventFormInitialState: EventFormInitialState;
    saveBanner: SaveBanner | null;
    locked?: boolean;
    onSave: (event: MatchEvent, opponentGkId?: string) => Promise<void>;
    onSaveMessage: (message: string, variant?: 'success' | 'error') => void;
    onSaved?: () => void;
    onCancel: () => void;
    onDelete: (eventId: string) => void;
    /**
     * Slot for mode-specific header content (e.g., team lock button for live mode)
     */
    headerSlot?: React.ReactNode;
    /**
     * Slot for mode-specific locked banner content
     */
    lockedBannerSlot?: React.ReactNode;
    /**
     * Translation key prefix for mode-specific labels
     */
    translationPrefix?: 'matchTracker' | 'video';
    /**
     * Ref to forward for scrolling purposes
     */
    formRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Shared component for the event form section including header and form
 */
export function EventFormSection({
    editingEvent,
    activeTeam,
    opponentTeam,
    activeTeamId,
    eventFormInitialState,
    saveBanner,
    locked = false,
    onSave,
    onSaveMessage,
    onSaved,
    onCancel,
    onDelete,
    headerSlot,
    lockedBannerSlot,
    translationPrefix = 'matchTracker',
    formRef,
}: EventFormSectionProps) {
    const { t } = useSafeTranslation();
    const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        };
    }, []);

    // Adapt team players to the format expected by EventForm
    const adaptTeamForEventForm = (team: TransformedTeam | null) => {
        if (!team) return undefined;
        return {
            ...team,
            players: team.players.map((p: TransformedPlayer) => ({
                id: p.id,
                number: p.number,
                name: p.name,
                position: p.position,
                isGoalkeeper: p.isGoalkeeper,
            })),
        };
    };

    if (!activeTeam) {
        return (
            <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 border-2 border-dashed mb-8">
                {t(`${translationPrefix}.selectTeamPrompt`)}
            </div>
        );
    }

    const editLabel = translationPrefix === 'video' ? t('video.editEvent') : t('matchTracker.editEvent');
    const newEventLabel = activeTeam
        ? t('matchTracker.newEventFor', { team: activeTeam.name })
        : t('matchTracker.newEvent');
    const hintLabel = translationPrefix === 'video' ? t('video.newEventHint') : t('matchTracker.clickHint');

    return (
        <div className="animate-fade-in mb-8" ref={formRef}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    {editingEvent ? (
                        <span className="text-indigo-600">{editLabel}</span>
                    ) : (
                        <>
                            <span className="text-green-600">{newEventLabel}</span>
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                {hintLabel}
                            </span>
                        </>
                    )}
                </h2>

                {saveBanner && (
                    <div
                        className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border ${saveBanner.variant === 'error'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                        role="status"
                        aria-live="polite"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={
                                    saveBanner.variant === 'error'
                                        ? 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                        : 'M5 13l4 4L19 7'
                                }
                            />
                        </svg>
                        {saveBanner.message}
                    </div>
                )}

                {headerSlot}
            </div>

            {lockedBannerSlot}

            <EventForm
                key={
                    editingEvent
                        ? editingEvent.id
                        : `new-event-${activeTeamId}-${eventFormInitialState.playerId ?? 'none'}-${eventFormInitialState.opponentGoalkeeperId ?? 'none'}`
                }
                event={editingEvent}
                team={adaptTeamForEventForm(activeTeam)!}
                opponentTeam={adaptTeamForEventForm(opponentTeam)}
                initialState={eventFormInitialState}
                onSave={onSave}
                onSaveMessage={onSaveMessage}
                onSaved={onSaved}
                onCancel={onCancel}
                onDelete={(eventId) => onDelete(eventId)}
                locked={locked}
            />
        </div>
    );
}

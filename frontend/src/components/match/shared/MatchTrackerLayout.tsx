/**
 * Shared Match Tracker Layout component
 * Provides consistent header and navigation for MatchTracker and VideoMatchTracker
 */
import { useSafeTranslation } from '../../../context/LanguageContext';

interface MatchTrackerLayoutProps {
    homeTeamName: string;
    visitorTeamName: string;
    matchId: string;
    activeTeamId?: string | null;
    backLabel?: string;
    onBack: () => void;
    onStatistics: () => void;
    /**
     * Optional custom title (e.g., for video mode)
     */
    title?: string;
    /**
     * Show video icon prefix in title
     */
    showVideoPrefix?: boolean;
    children: React.ReactNode;
}

/**
 * Shared layout component for match tracking pages
 * Includes header navigation, title, and statistics button
 */
export function MatchTrackerLayout({
    homeTeamName,
    visitorTeamName,
    backLabel,
    onBack,
    onStatistics,
    title,
    showVideoPrefix = false,
    children,
}: MatchTrackerLayoutProps) {
    const { t } = useSafeTranslation();

    const displayTitle = title ?? `${homeTeamName} vs ${visitorTeamName}`;
    const backText = backLabel ?? t('matchTracker.backToDashboard');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200 mb-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <button
                            onClick={onBack}
                            className="flex items-center text-gray-600 hover:text-indigo-600 font-medium"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            {backText}
                        </button>

                        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            {showVideoPrefix && (
                                <span className="hidden md:inline">{t('video.title')}:</span>
                            )}
                            {displayTitle}
                        </h1>

                        <button
                            onClick={onStatistics}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            {t('matchTracker.statistics')}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
                {children}
            </div>
        </div>
    );
}

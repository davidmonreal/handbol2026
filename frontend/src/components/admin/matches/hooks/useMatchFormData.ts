import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../../config/api';
import type { Team } from '../../../../types';

type Match = {
    id: string;
    date: string;
    homeTeamId: string;
    awayTeamId: string;
    homeTeam: { id: string; name: string; category?: string; club?: { name: string } };
    awayTeam: { id: string; name: string; category?: string; club?: { name: string } };
    isFinished: boolean;
    homeScore?: number;
    awayScore?: number;
    videoUrl?: string | null;
};

type MatchFormDataParams = {
    matchId?: string;
    isEditMode: boolean;
};

export const useMatchFormData = ({ matchId, isEditMode }: MatchFormDataParams) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    const [teams, setTeams] = useState<Team[]>([]);
    const [hasEvents, setHasEvents] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);

    const [dateValue, setDateValue] = useState('');
    const [timeValue, setTimeValue] = useState('12:00');
    const [selectedHomeTeamId, setSelectedHomeTeamId] = useState<string | null>(null);
    const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<string | null>(null);
    const [initialHomeTeamId, setInitialHomeTeamId] = useState<string | null>(null);
    const [initialAwayTeamId, setInitialAwayTeamId] = useState<string | null>(null);
    const [status, setStatus] = useState<'SCHEDULED' | 'FINISHED'>('SCHEDULED');
    const [homeScore, setHomeScore] = useState<string>('');
    const [awayScore, setAwayScore] = useState<string>('');

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setInfoMessage(null);
            setHasEvents(false);
            setHasVideo(false);
            try {
                const teamsRes = await fetch(`${API_BASE_URL}/api/teams`);
                const teamsData = await teamsRes.json();
                setTeams(teamsData);

                if (isEditMode && matchId) {
                    const matchRes = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
                    if (!matchRes.ok) throw new Error('Match not found');
                    const match: Match = await matchRes.json();

                    const dateObj = new Date(match.date);
                    setDateValue(dateObj.toISOString().split('T')[0]);
                    setTimeValue(
                        dateObj.toLocaleTimeString('ca-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        }),
                    );
                    setSelectedHomeTeamId(match.homeTeamId);
                    setSelectedAwayTeamId(match.awayTeamId);
                    setInitialHomeTeamId(match.homeTeamId);
                    setInitialAwayTeamId(match.awayTeamId);
                    setStatus(match.isFinished ? 'FINISHED' : 'SCHEDULED');
                    setHomeScore(match.homeScore?.toString() ?? '');
                    setAwayScore(match.awayScore?.toString() ?? '');
                    setHasVideo(!!match.videoUrl);

                    try {
                        const eventsRes = await fetch(`${API_BASE_URL}/api/game-events/match/${matchId}`);
                        if (eventsRes.ok) {
                            const events = await eventsRes.json();
                            setHasEvents(Array.isArray(events) && events.length > 0);
                        }
                    } catch (eventsErr) {
                        console.error('Failed to load match events', eventsErr);
                    }
                }
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load data');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [matchId, isEditMode]);

    return {
        isLoading,
        error,
        infoMessage,
        setError,
        setInfoMessage,
        teams,
        hasEvents,
        hasVideo,
        dateValue,
        setDateValue,
        timeValue,
        setTimeValue,
        selectedHomeTeamId,
        setSelectedHomeTeamId,
        selectedAwayTeamId,
        setSelectedAwayTeamId,
        initialHomeTeamId,
        initialAwayTeamId,
        status,
        setStatus,
        homeScore,
        setHomeScore,
        awayScore,
        setAwayScore,
    };
};

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
    const [initialDateValue, setInitialDateValue] = useState<string | null>(null);
    const [initialTimeValue, setInitialTimeValue] = useState<string | null>(null);
    const [initialStatus, setInitialStatus] = useState<'SCHEDULED' | 'FINISHED' | null>(null);
    const [initialHomeScore, setInitialHomeScore] = useState<string | null>(null);
    const [initialAwayScore, setInitialAwayScore] = useState<string | null>(null);
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
                    const nextDateValue = dateObj.toISOString().split('T')[0];
                    const nextTimeValue = dateObj.toLocaleTimeString('ca-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    });
                    const nextStatus = match.isFinished ? 'FINISHED' : 'SCHEDULED';
                    const nextHomeScore = match.homeScore?.toString() ?? '';
                    const nextAwayScore = match.awayScore?.toString() ?? '';

                    setDateValue(nextDateValue);
                    setTimeValue(nextTimeValue);
                    setSelectedHomeTeamId(match.homeTeamId);
                    setSelectedAwayTeamId(match.awayTeamId);
                    setInitialHomeTeamId(match.homeTeamId);
                    setInitialAwayTeamId(match.awayTeamId);
                    setInitialDateValue(nextDateValue);
                    setInitialTimeValue(nextTimeValue);
                    setInitialStatus(nextStatus);
                    setInitialHomeScore(nextHomeScore);
                    setInitialAwayScore(nextAwayScore);
                    setStatus(nextStatus);
                    setHomeScore(nextHomeScore);
                    setAwayScore(nextAwayScore);
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
        initialDateValue,
        initialTimeValue,
        initialStatus,
        initialHomeScore,
        initialAwayScore,
        status,
        setStatus,
        homeScore,
        setHomeScore,
        awayScore,
        setAwayScore,
    };
};

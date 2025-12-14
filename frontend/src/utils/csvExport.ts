import type { MatchEvent } from '../types';

export const downloadTeamEventsCSV = (events: MatchEvent[], teamId: string, teamName: string) => {
    const teamEvents = events
        .filter(e => e.teamId === teamId)
        .sort((a, b) => a.timestamp - b.timestamp);

    const headers = ['Time', 'Player', 'Number', 'Category', 'Action', 'Zone', 'Goal Target'].join(',');
    const rows = teamEvents.map(e => {
        const minutes = Math.floor(e.timestamp / 60);
        const seconds = e.timestamp % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        return [
            timeStr,
            e.playerName || '',
            e.playerNumber || '',
            e.category,
            e.action,
            e.zone || '',
            e.goalZoneTag || e.goalTarget || ''
        ].map(field => `"${field ?? ''}"`).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${teamName.replace(/\s+/g, '_')}_plays.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

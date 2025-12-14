import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const PageTitleUpdater = () => {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        let title = 'Dashboard';

        if (path === '/') {
            title = 'Dashboard';
        } else if (path.startsWith('/clubs')) {
            title = 'Clubs Management';
        } else if (path.startsWith('/seasons')) {
            title = 'Seasons Management';
        } else if (path.startsWith('/players/import')) {
            title = 'Import Players';
        } else if (path.startsWith('/players/new')) {
            title = 'New Player';
        } else if (path.match(/\/players\/[^/]+\/edit/)) {
            title = 'Edit Player';
        } else if (path.startsWith('/players')) {
            title = 'Players Management';
        } else if (path.startsWith('/teams/new')) {
            title = 'New Team';
        } else if (path.match(/\/teams\/[^/]+\/edit/)) {
            title = 'Edit Team';
        } else if (path.match(/\/teams\/[^/]+\/players/)) {
            title = 'Team Players';
        } else if (path.startsWith('/teams')) {
            title = 'Teams Management';
        } else if (path.startsWith('/matches/new')) {
            title = 'New Match';
        } else if (path.match(/\/matches\/[^/]+\/edit/)) {
            title = 'Edit Match';
        } else if (path.startsWith('/matches')) {
            title = 'Matches Management';
        } else if (path.startsWith('/statistics')) {
            title = 'Statistics';
        } else if (path.startsWith('/match-tracker')) {
            title = 'Match Tracking';
        } else if (path.startsWith('/video-tracker')) {
            title = 'Video Match Tracking';
        }

        document.title = `Handbol - ${title}`;
    }, [location]);

    return null;
};

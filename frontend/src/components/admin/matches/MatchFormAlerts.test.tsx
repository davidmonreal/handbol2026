import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { MatchFormAlerts } from './MatchFormAlerts';

describe('MatchFormAlerts', () => {
    it('renders error and info messages when provided', () => {
        render(<MatchFormAlerts error="Something went wrong" infoMessage="Saved" />);

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('renders nothing when messages are null', () => {
        const { container } = render(<MatchFormAlerts error={null} infoMessage={null} />);
        expect(container).toBeEmptyDOMElement();
    });
});

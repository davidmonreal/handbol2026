import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { MatchFormHeader } from './MatchFormHeader';

describe('MatchFormHeader', () => {
    it('renders title and triggers back handler', () => {
        const onBack = vi.fn();
        render(<MatchFormHeader isEditMode={true} onBack={onBack} />);

        expect(screen.getByText('Edit Match')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button'));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders new match title when not editing', () => {
        const onBack = vi.fn();
        render(<MatchFormHeader isEditMode={false} onBack={onBack} />);

        expect(screen.getByText('New Match')).toBeInTheDocument();
    });
});

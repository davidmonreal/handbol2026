import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal', () => {
    const defaultProps = {
        isOpen: true,
        message: 'Are you sure you want to proceed?',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<ConfirmationModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
        render(<ConfirmationModal {...defaultProps} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display default title', () => {
        render(<ConfirmationModal {...defaultProps} />);
        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('should display custom title', () => {
        render(<ConfirmationModal {...defaultProps} title="Delete Item" />);
        expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    it('should display message', () => {
        render(<ConfirmationModal {...defaultProps} />);
        expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('should display default button labels', () => {
        render(<ConfirmationModal {...defaultProps} />);
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should display custom button labels', () => {
        render(
            <ConfirmationModal
                {...defaultProps}
                confirmLabel="Delete"
                cancelLabel="Keep"
            />
        );
        expect(screen.getByText('Keep')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn();
        render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />);

        fireEvent.click(screen.getByTestId('confirmation-confirm-button'));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />);

        fireEvent.click(screen.getByTestId('confirmation-cancel-button'));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when clicking overlay', () => {
        const onCancel = vi.fn();
        render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />);

        fireEvent.click(screen.getByTestId('confirmation-modal-overlay'));

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when clicking modal content', () => {
        const onCancel = vi.fn();
        render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />);

        fireEvent.click(screen.getByRole('dialog'));

        expect(onCancel).not.toHaveBeenCalled();
    });

    it('should apply danger variant styles by default', () => {
        render(<ConfirmationModal {...defaultProps} />);
        const confirmButton = screen.getByTestId('confirmation-confirm-button');
        expect(confirmButton).toHaveClass('bg-red-600');
    });

    it('should apply warning variant styles', () => {
        render(<ConfirmationModal {...defaultProps} variant="warning" />);
        const confirmButton = screen.getByTestId('confirmation-confirm-button');
        expect(confirmButton).toHaveClass('bg-yellow-600');
    });

    it('should apply info variant styles', () => {
        render(<ConfirmationModal {...defaultProps} variant="info" />);
        const confirmButton = screen.getByTestId('confirmation-confirm-button');
        expect(confirmButton).toHaveClass('bg-indigo-600');
    });
});

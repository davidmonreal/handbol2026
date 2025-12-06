import type { ReactNode } from 'react';

export interface ConfirmationModalProps {
    isOpen: boolean;
    title?: string;
    message: string | ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const VARIANT_STYLES = {
    danger: {
        button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        icon: '⚠️',
    },
    warning: {
        button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        icon: '⚠️',
    },
    info: {
        button: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
        icon: 'ℹ️',
    },
};

export const ConfirmationModal = ({
    isOpen,
    title = 'Confirm Action',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
}: ConfirmationModalProps) => {
    if (!isOpen) return null;

    const styles = VARIANT_STYLES[variant];

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onCancel}
            data-testid="confirmation-modal-overlay"
        >
            <div
                className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl animate-fade-in"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <h3
                    id="modal-title"
                    className="text-lg font-bold text-gray-900 mb-4"
                >
                    {title}
                </h3>
                <div className="text-gray-600 mb-6">
                    {message}
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                        data-testid="confirmation-cancel-button"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
                        data-testid="confirmation-confirm-button"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

import type { LucideIcon } from 'lucide-react';
import { Plus, Minus, Pencil } from 'lucide-react';

interface IconButtonProps {
    icon: LucideIcon;
    onClick: () => void;
    title: string;
    variant?: 'primary' | 'danger' | 'neutral';
    size?: 'sm' | 'md';
    className?: string;
}

const ICON_SIZES = {
    sm: 16,
    md: 20,
} as const;

const VARIANT_STYLES = {
    primary: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700',
    neutral: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800',
} as const;

/**
 * Reusable icon button component with consistent styling.
 * Default state shows a subtle background color, hover intensifies both background and text.
 */
export const IconButton = ({
    icon: Icon,
    onClick,
    title,
    variant = 'neutral',
    size = 'md',
    className = '',
}: IconButtonProps) => {
    return (
        <button
            onClick={onClick}
            className={`p-2 rounded-lg transition-colors ${VARIANT_STYLES[variant]} ${className}`}
            title={title}
        >
            <Icon size={ICON_SIZES[size]} />
        </button>
    );
};

interface SimpleIconButtonProps {
    onClick: () => void;
    title?: string;
    size?: 'sm' | 'md';
    className?: string;
}

/**
 * Add button - indigo colored with plus styling
 */
export const AddIconButton = ({
    onClick,
    title = 'Add',
    size = 'md',
    className = '',
}: SimpleIconButtonProps) => {
    return (
        <IconButton
            icon={Plus}
            onClick={onClick}
            title={title}
            variant="primary"
            size={size}
            className={className}
        />
    );
};

/**
 * Remove button - red colored with minus styling
 */
export const RemoveIconButton = ({
    onClick,
    title = 'Remove',
    size = 'md',
    className = '',
}: SimpleIconButtonProps) => {
    return (
        <IconButton
            icon={Minus}
            onClick={onClick}
            title={title}
            variant="danger"
            size={size}
            className={className}
        />
    );
};

/**
 * Edit button - indigo colored with pencil styling
 */
export const EditIconButton = ({
    onClick,
    title = 'Edit',
    size = 'sm',
    className = '',
}: SimpleIconButtonProps) => {
    return (
        <IconButton
            icon={Pencil}
            onClick={onClick}
            title={title}
            variant="primary"
            size={size}
            className={className}
        />
    );
};


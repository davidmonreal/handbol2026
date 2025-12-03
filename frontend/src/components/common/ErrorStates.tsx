import { AlertCircle, XCircle } from 'lucide-react';

interface ErrorMessageProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    className?: string;
}

/**
 * Reusable error message component
 */
export const ErrorMessage = ({
    title = 'Error',
    message,
    onRetry,
    className = ''
}: ErrorMessageProps) => {
    return (
        <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                    <div className="flex-shrink-0">
                        <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-red-800">{title}</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{message}</p>
                        </div>
                    </div>
                </div>
                {onRetry && (
                    <div className="ml-4 flex-shrink-0">
                        <button
                            onClick={onRetry}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Empty state component
 */
export const EmptyState = ({
    icon: Icon = AlertCircle,
    title,
    description,
    actionLabel,
    onAction
}: {
    icon?: any;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}) => {
    return (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Icon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

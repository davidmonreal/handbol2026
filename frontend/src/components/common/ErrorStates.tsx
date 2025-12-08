import { XCircle } from 'lucide-react';

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

/**
 * Reusable loading spinner component with different sizes
 */
export const LoadingSpinner = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizeClasses[size]} ${className}`} />
    );
};

/**
 * Full page centered loading state
 */
export const LoadingPage = ({ message = 'Loading...' }: { message?: string }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 text-sm animate-pulse">{message}</p>
        </div>
    );
};

/**
 * Loading skeleton for card-based layouts
 */
export const LoadingCard = () => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
            </div>
        </div>
    );
};

/**
 * Loading skeleton for table rows
 */
export const LoadingTable = ({ rows = 5 }: { rows?: number }) => {
    return (
        <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <th key={i} className="px-6 py-3">
                                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from({ length: rows }).map((_, i) => (
                        <tr key={i}>
                            {[1, 2, 3, 4, 5].map((j) => (
                                <td key={j} className="px-6 py-4">
                                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/**
 * Grid of loading cards
 */
export const LoadingGrid = ({ items = 6 }: { items?: number }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: items }).map((_, i) => (
                <LoadingCard key={i} />
            ))}
        </div>
    );
};

type MatchFormAlertsProps = {
    error: string | null;
    infoMessage: string | null;
};

export const MatchFormAlerts = ({ error, infoMessage }: MatchFormAlertsProps) => (
    <>
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
            </div>
        )}
        {infoMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {infoMessage}
            </div>
        )}
    </>
);

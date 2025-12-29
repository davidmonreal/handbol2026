import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type DataRefreshContextValue = {
    refreshToken: number;
    bumpRefreshToken: () => void;
};

const DataRefreshContext = createContext<DataRefreshContextValue | undefined>(undefined);

export const DataRefreshProvider = ({ children }: { children: ReactNode }) => {
    const [refreshToken, setRefreshToken] = useState(0);

    const bumpRefreshToken = useCallback(() => {
        setRefreshToken((current) => current + 1);
    }, []);

    const value = useMemo(
        () => ({ refreshToken, bumpRefreshToken }),
        [refreshToken, bumpRefreshToken],
    );

    return (
        <DataRefreshContext.Provider value={value}>
            {children}
        </DataRefreshContext.Provider>
    );
};

export const useDataRefresh = () => {
    const context = useContext(DataRefreshContext);
    if (!context) {
        throw new Error('useDataRefresh must be used within a DataRefreshProvider');
    }
    return context;
};

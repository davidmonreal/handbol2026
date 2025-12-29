import { useNavigate } from 'react-router-dom';

type UseBackNavigationParams = {
    fromPath?: string;
    fallbackPath: string;
    allowHistoryBack?: boolean;
};

export const useBackNavigation = ({
    fromPath,
    fallbackPath,
    allowHistoryBack = false,
}: UseBackNavigationParams) => {
    const navigate = useNavigate();

    return () => {
        if (fromPath) {
            navigate(fromPath);
            return;
        }

        if (allowHistoryBack && window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate(fallbackPath);
    };
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackNavigation } from '../useBackNavigation';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

describe('useBackNavigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('navigates to fromPath when provided', () => {
        const { result } = renderHook(() =>
            useBackNavigation({ fromPath: '/origin', fallbackPath: '/fallback' }),
        );

        act(() => {
            result.current();
        });

        expect(navigateMock).toHaveBeenCalledWith('/origin');
    });

    it('navigates to fallback when no fromPath and history back is disabled', () => {
        const { result } = renderHook(() =>
            useBackNavigation({ fallbackPath: '/fallback' }),
        );

        act(() => {
            result.current();
        });

        expect(navigateMock).toHaveBeenCalledWith('/fallback');
    });

    it('navigates back when history is available and allowed', () => {
        const originalLength = window.history.length;
        Object.defineProperty(window.history, 'length', {
            value: 2,
            configurable: true,
        });

        const { result } = renderHook(() =>
            useBackNavigation({ fallbackPath: '/fallback', allowHistoryBack: true }),
        );

        act(() => {
            result.current();
        });

        expect(navigateMock).toHaveBeenCalledWith(-1);

        Object.defineProperty(window.history, 'length', {
            value: originalLength,
            configurable: true,
        });
    });
});

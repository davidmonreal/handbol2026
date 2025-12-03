import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Stub global fetch so it can be spied on
globalThis.fetch = vi.fn() as any;
if (typeof window !== 'undefined') {
    window.fetch = globalThis.fetch;
}

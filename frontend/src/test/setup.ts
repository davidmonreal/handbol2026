import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Stub global fetch so it can be spied on
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalThis.fetch = vi.fn() as any;
if (typeof window !== 'undefined') {
    window.fetch = globalThis.fetch;
}

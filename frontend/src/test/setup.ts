import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Stub global fetch so it can be spied on
globalThis.fetch = vi.fn();
window.fetch = globalThis.fetch;

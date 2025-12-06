import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('Type Definition Uniqueness', () => {
    it('should not have duplicate interface definitions', () => {
        // Find all exported interfaces and check for duplicates
        const result = execSync(
            'grep -rh "^export interface" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | sort | uniq -d || true',
            { encoding: 'utf-8', cwd: process.cwd() }
        );

        if (result.trim()) {
            throw new Error(
                `Found duplicate interface definitions:\n${result}\n` +
                'All interfaces should be defined in a single location (src/types/index.ts)'
            );
        }
    });

    it('should not have duplicate type alias definitions', () => {
        // Find all exported type aliases and check for duplicates
        const result = execSync(
            'grep -rh "^export type" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | sort | uniq -d || true',
            { encoding: 'utf-8', cwd: process.cwd() }
        );

        if (result.trim()) {
            throw new Error(
                `Found duplicate type alias definitions:\n${result}\n` +
                'All type aliases should be defined in a single location (src/types/index.ts)'
            );
        }
    });
});

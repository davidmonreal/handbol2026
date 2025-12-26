/// <reference types="node" />
import { describe, it } from 'vitest';
import { execSync } from 'child_process';

describe('Type Definition Uniqueness', () => {
    it('should not have duplicate interface definitions', () => {
        // Find all exported interfaces and check for duplicates
        // Exclude index.ts files (barrel exports) which legitimately re-export types
        const result = execSync(
            'grep -rh "^export interface" src/ --include="*.ts" --include="*.tsx" --exclude="index.ts" 2>/dev/null | sort | uniq -d || true',
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
        // Exclude:
        // - index.ts files (barrel exports) which legitimately re-export types
        // - Lines starting with "export type {" which are re-exports, not definitions
        const result = execSync(
            'grep -rh "^export type [A-Z]" src/ --include="*.ts" --include="*.tsx" --exclude="index.ts" 2>/dev/null | sort | uniq -d || true',
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

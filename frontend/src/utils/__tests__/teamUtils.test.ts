import { describe, it, expect } from 'vitest';
import { parseTeamName } from '../teamUtils';

describe('parseTeamName', () => {
    it('detects category at the start', () => {
        const result = parseTeamName('Juvenil Negre');
        expect(result.category).toBe('JUVENIL');
        expect(result.name).toBe('Negre');
    });

    it('detects category case insensitive and preserves name formatting', () => {
        const result = parseTeamName('juvenil groc');
        expect(result.category).toBe('JUVENIL');
        expect(result.name).toBe('groc'); // Preserves original formatting
    });

    it('defaults to SENIOR if no category found and preserves formatting', () => {
        const result = parseTeamName('Mataro A');
        expect(result.category).toBe('SENIOR');
        expect(result.name).toBe('Mataro A'); // Original formatting preserved
    });

    it('handles Prebenjami correctly vs Benjami', () => {
        const result = parseTeamName('Prebenjami A');
        expect(result.category).toBe('PREBENJAMI');
        expect(result.name).toBe('A');
    });

    it('handles just the category name', () => {
        const result = parseTeamName('Cadet');
        expect(result.category).toBe('CADET');
        expect(result.name).toBe('Cadet'); // Fallback to input if empty? 
        // In my implementation: 
        // cleanName = substring -> ""
        // return cleanName || inputName -> "Cadet"
        // Wait, if I type "Cadet", I want category Cadet and name empty?
        // Let's adjust implementation if needed.
    });
});

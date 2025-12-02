import { describe, test, expect } from 'vitest';
import { filterItems } from '../searchUtils';

describe('searchUtils - filterItems', () => {
    const testData = [
        {
            id: '1',
            name: 'Team A',
            category: 'SENIOR',
            club: { name: 'Mataró', city: 'Barcelona' }
        },
        {
            id: '2',
            name: 'Team B',
            category: 'INFANTIL',
            club: { name: 'La Roca', city: 'Vallès' }
        },
        {
            id: '3',
            name: 'Team C',
            category: 'CADET',
            club: { name: 'Granollers', city: 'Barcelona' }
        }
    ];

    test('filters by simple string field', () => {
        const result = filterItems(testData, 'Team A', ['name']);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    test('filters by nested field using dot notation', () => {
        const result = filterItems(testData, 'Mataró', ['club.name']);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    test('filters by multiple fields', () => {
        const result = filterItems(testData, 'Barcelona', ['club.city']);
        expect(result).toHaveLength(2);
    });

    test('is case insensitive', () => {
        const result = filterItems(testData, 'matarÓ', ['club.name']);
        expect(result).toHaveLength(1);
        expect(result[0].club.name).toBe('Mataró');
    });

    test('returns all items when search term is empty', () => {
        const result = filterItems(testData, '', ['name', 'club.name']);
        expect(result).toHaveLength(3);
    });

    test('returns empty array when no matches found', () => {
        const result = filterItems(testData, 'NonExistent', ['name', 'club.name']);
        expect(result).toHaveLength(0);
    });

    test('searches across multiple fields', () => {
        const result = filterItems(testData, 'La Roca', ['name', 'club.name']);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
    });

    test('handles deeply nested paths', () => {
        const deepData = [
            { id: '1', level1: { level2: { level3: 'deep value' } } },
            { id: '2', level1: { level2: { level3: 'other value' } } }
        ];

        const result = filterItems(deepData, 'deep', ['level1.level2.level3']);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    test('handles undefined nested values gracefully', () => {
        const incompleteData = [
            { id: '1', name: 'Item', club: { name: 'Club A' } },
            { id: '2', name: 'Item 2', club: undefined as any }
        ];

        const result = filterItems(incompleteData, 'Club A', ['club.name']);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });
});

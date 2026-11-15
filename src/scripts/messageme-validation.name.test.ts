import { describe, expect, test } from 'vitest';
import fc from 'fast-check';

import { MAX_NAME_LENGTH, validateName } from './messageme-validation';

// Feature: messageme-form-fields, Property 1: validateName returns null iff trimmed length is 1..100
//
// Property 1: Name validation matches the 1-100 non-whitespace rule
// Validates: Requirements 1.1, 1.4, 1.5
describe('validateName — Property 1: name validation 1..100 non-whitespace rule', () => {
    test('returns null iff trimmed length is 1..100', () => {
        // Draw from several disjoint slices of the input space so the property
        // exercises the interesting cases the spec calls out:
        //   - the empty string (Req 1.4: required)
        //   - whitespace-only strings (Req 1.4: required)
        //   - trimmed lengths on the valid boundaries 1 and 100 (Req 1.1)
        //   - trimmed lengths of 101+, over the limit (Req 1.1)
        //   - fully arbitrary strings (general coverage)
        const whitespaceUnit = fc.constantFrom(' ', '\t', '\n', '\r', '\f', '\v');

        const emptyValue = fc.constant('');

        const whitespaceOnly = fc.string({ unit: whitespaceUnit, minLength: 1 });

        // A non-whitespace core of a chosen length, optionally padded with
        // surrounding whitespace that trimming must ignore.
        const paddedCore = fc
            .tuple(
                fc.integer({ min: 1, max: 200 }),
                fc.string({ unit: whitespaceUnit, maxLength: 5 }),
                fc.string({ unit: whitespaceUnit, maxLength: 5 }),
            )
            .map(([coreLength, leading, trailing]) => `${leading}${'a'.repeat(coreLength)}${trailing}`);

        const anyValue = fc.oneof(emptyValue, whitespaceOnly, paddedCore, fc.string());

        fc.assert(
            fc.property(anyValue, (value) => {
                const trimmedLength = value.trim().length;
                const inRange = trimmedLength >= 1 && trimmedLength <= MAX_NAME_LENGTH;
                const expected = inRange ? null : 'required';
                // Req 1.1/1.4/1.5: null (field clears) iff 1..100 non-whitespace
                // characters remain after trimming, otherwise 'required'.
                expect(validateName(value)).toBe(expected);
            }),
            { numRuns: 200 },
        );
    });

    test('handles the exact boundary lengths 1 / 100 / 101', () => {
        expect(validateName('')).toBe('required');
        expect(validateName('   ')).toBe('required');
        expect(validateName('a')).toBeNull();
        expect(validateName('a'.repeat(MAX_NAME_LENGTH))).toBeNull();
        expect(validateName('a'.repeat(MAX_NAME_LENGTH + 1))).toBe('required');
    });
});

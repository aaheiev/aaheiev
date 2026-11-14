import { describe, expect, test } from 'vitest';
import fc from 'fast-check';

import {
    MAX_MESSAGE_LENGTH,
    validateMessage,
} from './messageme-validation';

// Feature: messageme-form-fields, Property 3: validateMessage returns required for empty, maxlength over 2000, null within 1..2000
//
// Property 3: Message length validation enforces the 1-2000 bound
// Validates: Requirements 2.1, 2.4, 2.5
describe('validateMessage — Property 3: message length validation', () => {
    test('returns required for empty, maxlength over 2000, null within 1..2000', () => {
        // Generate strings whose lengths cluster around the interesting
        // boundaries (0 / 1 / MAX / MAX+1) plus some larger-than-max lengths,
        // so the property exercises both edges and interior of the 1..2000 band.
        const boundaryLength = fc.oneof(
            fc.constant(0),
            fc.constant(1),
            fc.constant(MAX_MESSAGE_LENGTH - 1),
            fc.constant(MAX_MESSAGE_LENGTH),
            fc.constant(MAX_MESSAGE_LENGTH + 1),
            fc.integer({ min: 2, max: MAX_MESSAGE_LENGTH - 2 }),
            fc.integer({ min: MAX_MESSAGE_LENGTH + 2, max: MAX_MESSAGE_LENGTH * 3 }),
        );

        const messageOfLength = boundaryLength.chain((length) =>
            fc.string({ minLength: length, maxLength: length }),
        );

        fc.assert(
            fc.property(messageOfLength, (value) => {
                const result = validateMessage(value);

                if (value.length === 0) {
                    // Req 2.4: empty message is required.
                    expect(result).toBe('required');
                } else if (value.length > MAX_MESSAGE_LENGTH) {
                    // Req 2.5: over the 2000-character limit is maxlength.
                    expect(result).toBe('maxlength');
                } else {
                    // Req 2.1: any length in 1..2000 is accepted.
                    expect(result).toBeNull();
                }
            }),
            { numRuns: 200 },
        );
    });
});

import { describe, expect, test } from 'vitest';
import fc from 'fast-check';

import { validateEmail } from './messageme-validation';

// Feature: messageme-form-fields, Property 2: validateEmail returns required for empty, email for invalid, null for valid
//
// Property 2: Email validation classifies empty, invalid, and valid inputs
// Validates: Requirements 3.4, 3.5, 3.6
describe('validateEmail — Property 2: email validation classification', () => {
    test('returns required for empty, email for invalid, null for valid', () => {
        // Three disjoint slices of the input space:
        //   - the empty string (Req 3.4: required)
        //   - non-empty strings that cannot be valid emails because they
        //     contain no "@" (Req 3.5: email)
        //   - generated valid addresses via fc.emailAddress() (Req 3.6: null)
        const emptyValue = fc.constant('');

        const invalidValue = fc
            .string({ minLength: 1 })
            .filter((s) => s.length > 0 && !s.includes('@'));

        const validValue = fc.emailAddress();

        const anyValue = fc.oneof(emptyValue, invalidValue, validValue);

        fc.assert(
            fc.property(anyValue, (value) => {
                const result = validateEmail(value);

                if (value.length === 0) {
                    // Req 3.4: an empty email field is required.
                    expect(result).toBe('required');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    // Req 3.5: a non-empty value that is not a valid email.
                    expect(result).toBe('email');
                } else {
                    // Req 3.6: a valid email address passes validation.
                    expect(result).toBeNull();
                }
            }),
            { numRuns: 200 },
        );
    });
});

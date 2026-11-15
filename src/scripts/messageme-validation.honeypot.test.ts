import { describe, expect, test } from 'vitest';
import fc from 'fast-check';

import {
    computeSubmitOutcome,
    type FormInput,
} from './messageme-validation';

// Feature: messageme-form-fields, Property 4: success reached iff honeypot empty, no distinguishing feedback when filled
//
// Property 4: Honeypot gates the success path with indistinguishable handling
// Validates: Requirements 4.4, 4.5
describe('computeSubmitOutcome — Property 4: honeypot gating', () => {
    test('success reached iff honeypot empty; filled honeypot is silently dropped with no distinguishing feedback', () => {
        // Keep the three real fields in their otherwise-valid band so the only
        // variable that decides the outcome is the honeypot. A valid name is
        // 1..100 non-whitespace chars, a valid email matches the module's
        // pattern, and a valid message is 1..2000 chars.
        const validName = fc
            .string({ minLength: 1, maxLength: 100 })
            // Ensure at least one non-whitespace char and trimmed length >= 1.
            .map((s) => `n${s}`.slice(0, 100));

        const validEmail = fc.emailAddress();

        const validMessage = fc.string({ minLength: 1, maxLength: 2000 });

        // Honeypot: empty (success path) vs non-empty (silently dropped). The
        // non-empty branch generates arbitrary strings including whitespace.
        const honeypot = fc.oneof(
            fc.constant(''),
            fc.string({ minLength: 1, maxLength: 50 }),
        );

        fc.assert(
            fc.property(
                validName,
                validEmail,
                validMessage,
                honeypot,
                (name, emailAddress, message, hp) => {
                    const input: FormInput = {
                        name,
                        emailAddress,
                        message,
                        honeypot: hp,
                    };

                    const outcome = computeSubmitOutcome(input);

                    if (hp.length === 0) {
                        // Req 4.5: empty honeypot + valid fields => normal
                        // success path reached without interference.
                        expect(outcome.status).toBe('success');
                    } else {
                        // Req 4.4: a filled honeypot keeps the success outcome
                        // hidden ...
                        expect(outcome.status).toBe('silently-dropped');
                        expect(outcome.status).not.toBe('success');
                        // ... and surfaces no field errors, so the response is
                        // indistinguishable from an idle form (no feedback that
                        // tells a detected bot apart from a success).
                        expect(outcome.errors).toEqual({
                            name: null,
                            emailAddress: null,
                            message: null,
                        });
                    }
                },
            ),
            { numRuns: 200 },
        );
    });
});

import { describe, expect, test } from 'vitest';
import fc from 'fast-check';

import {
    MAX_MESSAGE_LENGTH,
    MAX_NAME_LENGTH,
    computeSubmitOutcome,
    isHoneypotTriggered,
    validateEmail,
    validateMessage,
    validateName,
    type FormInput,
} from './messageme-validation';

// Feature: messageme-form-fields, Property 5: outcome is success iff honeypot empty and all validators null; inputs unchanged otherwise
//
// Property 5: Submit outcome and value retention
// Validates: Requirements 2.4, 2.5, 1.4, 3.4, 4.4
describe('computeSubmitOutcome — Property 5: submit outcome and value retention', () => {
    test('status is success iff honeypot empty and all validators null; inputs are never mutated', () => {
        // Generators that intentionally span both the pass and fail halves of
        // every field so that across runs we cover all pass/fail combinations
        // of name / email / message / honeypot rather than only the happy path.

        // Name: whitespace-only and empty fail; 1..MAX trimmed pass; over-MAX fail.
        const nameArb = fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.string({ minLength: 1, maxLength: MAX_NAME_LENGTH }),
            fc.string({ minLength: MAX_NAME_LENGTH + 1, maxLength: MAX_NAME_LENGTH + 20 }),
        );

        // Email: empty (required), junk (email), and well-formed addresses (null).
        const emailArb = fc.oneof(
            fc.constant(''),
            fc.string(),
            fc.emailAddress(),
        );

        // Message: empty (required), in-band (null), over-limit (maxlength).
        const messageArb = fc.oneof(
            fc.constant(''),
            fc.string({ minLength: 1, maxLength: MAX_MESSAGE_LENGTH }),
            fc
                .integer({ min: MAX_MESSAGE_LENGTH + 1, max: MAX_MESSAGE_LENGTH + 50 })
                .chain((length) => fc.string({ minLength: length, maxLength: length })),
        );

        // Honeypot: deliberately weight empty vs filled so the success path is
        // reachable while filled values still get exercised often.
        const honeypotArb = fc.oneof(fc.constant(''), fc.string());

        const inputArb = fc.record<FormInput>({
            name: nameArb,
            emailAddress: emailArb,
            message: messageArb,
            honeypot: honeypotArb,
        });

        fc.assert(
            fc.property(inputArb, (input) => {
                // Snapshot the raw field values up front so we can prove the
                // outcome computation leaves its inputs untouched.
                const before = {
                    name: input.name,
                    emailAddress: input.emailAddress,
                    message: input.message,
                    honeypot: input.honeypot,
                };

                const outcome = computeSubmitOutcome(input);

                const honeypotFilled = isHoneypotTriggered(input.honeypot);
                const allValidatorsNull =
                    validateName(input.name) === null &&
                    validateEmail(input.emailAddress) === null &&
                    validateMessage(input.message) === null;

                if (honeypotFilled) {
                    // Req 4.4: a filled honeypot never reaches success and
                    // surfaces no distinguishing per-field errors.
                    expect(outcome.status).toBe('silently-dropped');
                    expect(outcome.errors).toEqual({
                        name: null,
                        emailAddress: null,
                        message: null,
                    });
                } else if (allValidatorsNull) {
                    // Reqs 1.4 / 2.4 / 2.5 / 3.4: honeypot empty and every field
                    // valid is the only success case.
                    expect(outcome.status).toBe('success');
                    expect(outcome.errors).toEqual({
                        name: null,
                        emailAddress: null,
                        message: null,
                    });
                } else {
                    // Honeypot empty but at least one field invalid => blocked,
                    // with the populated per-field errors mirroring the validators.
                    expect(outcome.status).toBe('blocked');
                    expect(outcome.errors).toEqual({
                        name: validateName(input.name),
                        emailAddress: validateEmail(input.emailAddress),
                        message: validateMessage(input.message),
                    });
                }

                // success iff honeypot empty AND all validators null.
                expect(outcome.status === 'success').toBe(
                    !honeypotFilled && allValidatorsNull,
                );

                // Value retention: the input snapshot must be unchanged.
                expect(input).toEqual(before);
            }),
            { numRuns: 200 },
        );
    });
});

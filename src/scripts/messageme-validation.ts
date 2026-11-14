//
// MessageMe form — pure field validators
//
// This module contains only pure functions and constants (no DOM access) so it
// can be imported by the MessageMe component script and exercised directly by
// unit and property-based tests.

/** Maximum accepted length (trimmed) for the name field. */
export const MAX_NAME_LENGTH = 100;

/** Maximum accepted length for the message field. */
export const MAX_MESSAGE_LENGTH = 2000;

/** The keys identifying each validated form field. */
export type FieldKey = 'name' | 'emailAddress' | 'message';

/**
 * Email pattern used to classify the email field. Requires a non-empty local
 * part, an `@`, a domain with at least one dot, and no whitespace anywhere.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The honeypot is triggered whenever it holds any value. Human visitors never
 * see or focus the field, so a non-empty value signals an automated submission.
 */
export function isHoneypotTriggered(value: string): boolean {
    return value.length > 0;
}

/**
 * Validate the name field.
 *
 * Returns `null` when the trimmed value has length between 1 and
 * `MAX_NAME_LENGTH` inclusive (i.e. at least one non-whitespace character and
 * not over the limit), otherwise `'required'`.
 */
export function validateName(value: string): 'required' | null {
    const trimmedLength = value.trim().length;
    if (trimmedLength >= 1 && trimmedLength <= MAX_NAME_LENGTH) {
        return null;
    }
    return 'required';
}

/**
 * Validate the email field.
 *
 * Returns `'required'` when the value is empty, `'email'` when it is non-empty
 * but does not match the email pattern, and `null` when it is a valid email.
 */
export function validateEmail(value: string): 'required' | 'email' | null {
    if (value.length === 0) {
        return 'required';
    }
    if (!EMAIL_PATTERN.test(value)) {
        return 'email';
    }
    return null;
}

/**
 * Validate the message field.
 *
 * Returns `'required'` when the value is empty, `'maxlength'` when it exceeds
 * `MAX_MESSAGE_LENGTH` characters, and `null` when the length is between 1 and
 * `MAX_MESSAGE_LENGTH` inclusive.
 */
export function validateMessage(value: string): 'required' | 'maxlength' | null {
    if (value.length === 0) {
        return 'required';
    }
    if (value.length > MAX_MESSAGE_LENGTH) {
        return 'maxlength';
    }
    return null;
}

/** In-memory snapshot of the form fields read from the DOM at submit time. */
export interface FormInput {
    name: string;
    emailAddress: string;
    message: string;
    honeypot: string;
}

/**
 * The outcome produced by the submit handler:
 * - `'silently-dropped'`: honeypot was non-empty; no success, no distinguishing feedback.
 * - `'blocked'`: honeypot empty but at least one field failed validation.
 * - `'success'`: honeypot empty and every field validator returned `null`.
 */
export type OutcomeStatus = 'silently-dropped' | 'blocked' | 'success';

/** Per-field failure reason key (or `null` when the field is valid). */
export type FieldErrors = Record<FieldKey, string | null>;

/** The result of computing a submit outcome. */
export interface SubmitOutcome {
    status: OutcomeStatus;
    errors: FieldErrors;
}

/** An all-`null` errors record (every field valid / no errors surfaced). */
function emptyErrors(): FieldErrors {
    return { name: null, emailAddress: null, message: null };
}

/**
 * Compute the submit outcome for a snapshot of the form fields.
 *
 * The honeypot is checked first: a non-empty honeypot yields
 * `'silently-dropped'` with no field errors surfaced (indistinguishable from an
 * idle form). When the honeypot is empty, all three field validators run; the
 * outcome is `'success'` iff every validator returns `null`, otherwise
 * `'blocked'` with the populated per-field `errors` record.
 */
export function computeSubmitOutcome(input: FormInput): SubmitOutcome {
    if (isHoneypotTriggered(input.honeypot)) {
        return { status: 'silently-dropped', errors: emptyErrors() };
    }

    const errors: FieldErrors = {
        name: validateName(input.name),
        emailAddress: validateEmail(input.emailAddress),
        message: validateMessage(input.message),
    };

    const valid =
        errors.name === null &&
        errors.emailAddress === null &&
        errors.message === null;

    return { status: valid ? 'success' : 'blocked', errors };
}

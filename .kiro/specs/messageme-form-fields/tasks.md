# Implementation Plan: MessageMe Form Fields

## Overview

This plan extends the MessageMe form in `src/components/MessageMe.astro` with a Name field, a Message textarea, and a simulated honeypot anti-bot control, backed by a new pure-validation module and a client-side submit handler. It installs Vitest + fast-check (no test framework exists today), implements the pure validators first so property tests can exercise them directly, then wires the DOM glue in the Astro component, applies the SCSS changes, and adds rendering and integration coverage. Each step builds on the previous and ends with everything wired into the rendered form.

## Tasks

- [x] 1. Set up test tooling
  - Install `vitest`, `fast-check`, and a DOM environment (`jsdom` or `happy-dom`) as dev dependencies
  - Add a `vitest.config.ts` (or extend the Astro/Vite config) with the DOM test environment and a `test` script in `package.json`
  - Create the `src/scripts` test location convention (e.g. colocated `*.test.ts` or a `tests/` folder) so later test tasks have a home
  - _Requirements: supports testing of 1.1, 2.1, 3.4, 4.1, 4.4_

- [x] 2. Implement the pure validation module
  - [x] 2.1 Create `src/scripts/messageme-validation.ts` with the pure field validators
    - Define `MAX_NAME_LENGTH = 100`, `MAX_MESSAGE_LENGTH = 2000`, and the `FieldKey` type (`'name' | 'emailAddress' | 'message'`)
    - Implement `isHoneypotTriggered(value: string): boolean` returning `value.length > 0`
    - Implement `validateName(value: string): 'required' | null` — `null` iff `value.trim()` length is 1..100 inclusive, else `'required'`
    - Implement `validateEmail(value: string): 'required' | 'email' | null` — `'required'` when empty, `'email'` when non-empty but not matching the email pattern, else `null`
    - Implement `validateMessage(value: string): 'required' | 'maxlength' | null` — `'required'` when empty, `'maxlength'` when length > 2000, else `null`
    - Export all validators and constants for reuse by the component script and tests
    - _Requirements: 1.1, 1.4, 2.1, 2.4, 2.5, 3.4, 3.5, 4.3_

  - [x] 2.2 Implement the submit-outcome computation function
    - Add an outcome function in `messageme-validation.ts` that takes `{ name, emailAddress, message, honeypot }` and returns an outcome of `'silently-dropped' | 'blocked' | 'success'` plus the per-field `errors` record
    - Honeypot checked first: non-empty honeypot yields `'silently-dropped'` with no field errors surfaced
    - When honeypot empty, run all three validators; `'success'` iff all return `null`, otherwise `'blocked'` with populated `errors`
    - _Requirements: 4.4, 4.5, 1.4, 2.4, 2.5, 3.4_

  - [x] 2.3 Write property test for name validation
    - **Property 1: Name validation matches the 1-100 non-whitespace rule**
    - **Validates: Requirements 1.1, 1.4, 1.5**
    - Tag: `// Feature: messageme-form-fields, Property 1: validateName returns null iff trimmed length is 1..100`
    - Use `fast-check` with >=100 iterations; generate arbitrary strings including whitespace-only, empty, and boundary lengths 1 / 100 / 101

  - [x] 2.4 Write property test for email validation
    - **Property 2: Email validation classifies empty, invalid, and valid inputs**
    - **Validates: Requirements 3.4, 3.5, 3.6**
    - Tag: `// Feature: messageme-form-fields, Property 2: validateEmail returns required for empty, email for invalid, null for valid`
    - Use `fast-check` with >=100 iterations; cover empty, random non-email strings, and generated valid emails (`fc.emailAddress()`)

  - [x] 2.5 Write property test for message length validation
    - **Property 3: Message length validation enforces the 1-2000 bound**
    - **Validates: Requirements 2.1, 2.4, 2.5**
    - Tag: `// Feature: messageme-form-fields, Property 3: validateMessage returns required for empty, maxlength over 2000, null within 1..2000`
    - Use `fast-check` with >=100 iterations; generate strings around boundaries 0 / 1 / 2000 / 2001 and large lengths

  - [x] 2.6 Write property test for honeypot gating
    - **Property 4: Honeypot gates the success path with indistinguishable handling**
    - **Validates: Requirements 4.4, 4.5**
    - Tag: `// Feature: messageme-form-fields, Property 4: success reached iff honeypot empty, no distinguishing feedback when filled`
    - Use `fast-check` with >=100 iterations; generate arbitrary honeypot strings (empty vs non-empty) with otherwise-valid fields

  - [x] 2.7 Write property test for submit outcome and value retention
    - **Property 5: Submit outcome and value retention**
    - **Validates: Requirements 2.4, 2.5, 1.4, 3.4, 4.4**
    - Tag: `// Feature: messageme-form-fields, Property 5: outcome is success iff honeypot empty and all validators null; inputs unchanged otherwise`
    - Use `fast-check` with >=100 iterations; generate tuples of name/email/message/honeypot covering all pass/fail combinations and assert inputs are not mutated

- [x] 3. Checkpoint - validators and property tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Add the new form markup in `MessageMe.astro`
  - [x] 4.1 Add the Name field and its feedback
    - Insert a `row`/`col` block with `<input id="name" name="name" class="form-control" type="text" maxlength="100" placeholder="Enter your name..." aria-label="Enter your name..." data-sb-validations="required" />`
    - Add the `invalid-feedback` element keyed `data-sb-feedback="name:required"`
    - _Requirements: 1.1, 1.2, 1.3, 5.1_

  - [x] 4.2 Add the Message textarea and its feedback
    - Insert a `row`/`col` block with `<textarea id="message" name="message" class="form-control" rows="4" maxlength="2000" placeholder="Enter your message..." aria-label="Enter your message..." data-sb-validations="required"></textarea>`
    - Add the `invalid-feedback` elements keyed `data-sb-feedback="message:required"` and `data-sb-feedback="message:maxlength"`
    - _Requirements: 2.1, 2.2, 2.3, 5.2_

  - [x] 4.3 Add the honeypot field and preserve the email field and submit button
    - Add the `.honeypot-field` wrapper with `aria-hidden="true"`, a label, and `<input id="contactCompany" name="contactCompany" type="text" tabindex="-1" autocomplete="off" />`
    - Keep the existing `#emailAddress` input (type `email`, `form-control`, `data-sb-validations="required,email"`) and its `required`/`email` `invalid-feedback` elements intact
    - Keep `#submitButton` (`btn btn-primary`, type `submit`) but remove the dead `disabled` class so the custom handler receives the submit event
    - Order the blocks Name -> Email -> Message -> Honeypot -> Submit using existing `row` / `col` / `col-auto` classes, and leave `#submitSuccessMessage` and `#submitErrorMessage` with their `d-none` class unchanged
    - _Requirements: 3.1, 3.2, 3.3, 4.3, 5.3, 5.4, 5.5_

- [x] 5. Wire the client-side submit handler in `MessageMe.astro`
  - [x] 5.1 Add the component `<script>` block importing the validators and running submit logic
    - Import `isHoneypotTriggered`, `validateName`, `validateEmail`, `validateMessage`, and the outcome function from `../scripts/messageme-validation`
    - Grab element handles (`#contactForm`, `#contactCompany`, `#name`, `#emailAddress`, `#message`) with null-checks and early return if the form or a required field is absent
    - Implement `showFeedback(fieldKey, reason)` and `clearFeedback(fieldKey)` DOM glue that toggles the matching `invalid-feedback` (keyed by `data-sb-feedback="field:reason"`) and the field's `is-invalid` class
    - Implement `handleSubmit`: `preventDefault`, run honeypot check first (silent non-success when filled), then field validation, then toggle `#submitSuccessMessage` / `#submitErrorMessage`; block and retain values on failure, clear all feedback and show success when valid
    - _Requirements: 1.4, 2.4, 2.5, 3.4, 3.5, 3.6, 4.1, 4.2, 4.4, 4.5, 5.5_

  - [x] 5.2 Wire input-event feedback clearing
    - Attach `input` listeners to the name, email, and message fields that re-check the single field and clear its feedback once it becomes valid
    - _Requirements: 1.5, 3.6_

- [x] 6. Apply SCSS styling in `_message-me.scss`
  - [x] 6.1 Extend input styling to textarea and hide the honeypot
    - Extend the `.form-signup input` selector to also target `textarea` so the Message field inherits the Grayscale form styling
    - Add an off-screen visually-hidden rule for `.honeypot-field` so it is not rendered, not focusable, and absent from layout
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 7. Checkpoint - markup, behavior, and styling
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add rendering and network integration tests
  - [x] 8.1 Write rendering/attribute example tests
    - Render the component markup into the DOM environment and assert: Name input has `form-control`, non-empty `placeholder`, and `aria-label` equal to the placeholder (1.2, 1.3, 5.1); textarea has `rows` >= 3, `maxlength="2000"`, `form-control`, non-empty `placeholder`, and matching `aria-label` (2.1, 2.2, 2.3, 5.2)
    - Assert the Email input and Submit button retain ids, types, classes, and `data-sb-validations` (3.1, 3.2, 3.3)
    - Assert honeypot has `tabindex="-1"`, `aria-hidden="true"`, `autocomplete="off"` and visually-hidden styling (4.3, 5.4), DOM order Name -> Email -> Message -> Honeypot -> Submit (5.3), and `#submitSuccessMessage` / `#submitErrorMessage` present with `d-none` (5.5)
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.2 Write network-behavior integration tests
    - Spy on `fetch` and `XMLHttpRequest`, dispatch a `submit` event on the form, and assert zero outbound requests are issued for both a valid submission and a honeypot-triggered submission
    - _Requirements: 4.1, 4.2_

- [x] 9. Final checkpoint - full suite
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (test tasks) and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation.
- The five property tests validate the pure validators and outcome function in `src/scripts/messageme-validation.ts`; each runs >=100 iterations with `fast-check` and carries the required tag.
- Rendering/attribute and network behavior are covered by example and integration tests, not properties.
- Requirement 4.6 (challenge branch) is intentionally not implemented; the honeypot branch was selected in the design.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "6.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "4.1"] },
    { "id": 3, "tasks": ["2.6", "2.7", "4.2"] },
    { "id": 4, "tasks": ["4.3"] },
    { "id": 5, "tasks": ["5.1", "8.1"] },
    { "id": 6, "tasks": ["5.2", "8.2"] }
  ]
}
```

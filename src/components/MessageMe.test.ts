// @vitest-environment node
//
// IMPORTANT: this file runs in the `node` environment (overriding the project
// default of `happy-dom`). Astro's Vite plugin picks its build output from the
// resolved export conditions: under a browser-like environment it compiles the
// `.astro` component to its *client* stub, which throws "Astro components
// cannot be used in the browser" when the Container API tries to render it.
// Running in `node` makes Astro resolve the SSR build so the component renders
// to an HTML string. We then parse that string into a real DOM with happy-dom's
// Window (constructed explicitly, since there is no global `document` here).
import { beforeAll, describe, expect, test } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';

import MessageMe from './MessageMe.astro';

// Rendering / attribute example tests for the MessageMe form (Task 8.1).
//
// These are EXAMPLE tests (not property tests): the markup is static, so its
// attributes and DOM order do not vary with input. We render the component to
// an HTML string with Astro's experimental Container API, parse it into a DOM,
// and assert the static structural/accessibility contract.
//
// Validates: Requirements 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3,
//            4.3, 5.1, 5.2, 5.3, 5.4, 5.5
describe('MessageMe.astro — rendering / attributes', () => {
  let root: HTMLElement;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(MessageMe);

    // Parse the rendered markup into a real DOM so queries run against the DOM
    // API rather than string matching.
    const window = new Window();
    const doc = window.document;
    root = doc.createElement('div') as unknown as HTMLElement;
    root.innerHTML = html;
  });

  // --- Name field (Req 1.2, 1.3, 5.1) ---------------------------------------
  describe('Name field', () => {
    test('has form-control, a non-empty placeholder, and aria-label equal to the placeholder', () => {
      const name = root.querySelector('#name') as HTMLInputElement | null;
      expect(name).not.toBeNull();

      // Req 5.1: inherits Grayscale form styling via form-control.
      expect(name!.classList.contains('form-control')).toBe(true);

      // Req 1.2: placeholder indicating a name is expected.
      const placeholder = name!.getAttribute('placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder!.length).toBeGreaterThan(0);

      // Req 1.3: aria-label equivalent to the placeholder text.
      expect(name!.getAttribute('aria-label')).toBe(placeholder);
    });
  });

  // --- Message textarea (Req 2.1, 2.2, 2.3, 5.2) ----------------------------
  describe('Message textarea', () => {
    test('has rows >= 3, maxlength 2000, form-control, non-empty placeholder and matching aria-label', () => {
      const message = root.querySelector('#message') as HTMLTextAreaElement | null;
      expect(message).not.toBeNull();

      // Element is a textarea (multi-line input).
      expect(message!.tagName.toLowerCase()).toBe('textarea');

      // Req 2.1: at least 3 visible rows and up to 2000 characters.
      const rows = Number(message!.getAttribute('rows'));
      expect(rows).toBeGreaterThanOrEqual(3);
      expect(message!.getAttribute('maxlength')).toBe('2000');

      // Req 5.2: inherits Grayscale form styling via form-control.
      expect(message!.classList.contains('form-control')).toBe(true);

      // Req 2.2: non-empty placeholder.
      const placeholder = message!.getAttribute('placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder!.length).toBeGreaterThan(0);

      // Req 2.3: aria-label identical to the placeholder.
      expect(message!.getAttribute('aria-label')).toBe(placeholder);
    });
  });

  // --- Email field & Submit button preserved (Req 3.1, 3.2, 3.3) ------------
  describe('Email field and Submit button', () => {
    test('email input retains id, type, class, and data-sb-validations', () => {
      const email = root.querySelector('#emailAddress') as HTMLInputElement | null;
      expect(email).not.toBeNull();

      // Req 3.1: id `emailAddress`, type `email`, class `form-control`.
      expect(email!.getAttribute('type')).toBe('email');
      expect(email!.classList.contains('form-control')).toBe(true);

      // Req 3.3: email validation attribute preserved.
      expect(email!.getAttribute('data-sb-validations')).toBe('required,email');
    });

    test('submit button retains id, type, and classes', () => {
      const submit = root.querySelector('#submitButton') as HTMLButtonElement | null;
      expect(submit).not.toBeNull();

      // Req 3.2: id `submitButton`, type `submit`, classes `btn btn-primary`.
      expect(submit!.getAttribute('type')).toBe('submit');
      expect(submit!.classList.contains('btn')).toBe(true);
      expect(submit!.classList.contains('btn-primary')).toBe(true);
    });
  });

  // --- Honeypot (Req 4.3, 5.4) ----------------------------------------------
  describe('Honeypot field', () => {
    test('input has tabindex -1 and autocomplete off, wrapper is aria-hidden', () => {
      const honeypot = root.querySelector('#contactCompany') as HTMLInputElement | null;
      expect(honeypot).not.toBeNull();

      // Req 4.3: excluded from tab order and from browser autofill.
      expect(honeypot!.getAttribute('tabindex')).toBe('-1');
      expect(honeypot!.getAttribute('autocomplete')).toBe('off');

      // Req 4.3: excluded from the accessibility tree via the wrapper.
      const wrapper = honeypot!.closest('.honeypot-field');
      expect(wrapper).not.toBeNull();
      expect(wrapper!.getAttribute('aria-hidden')).toBe('true');
    });

    // Req 5.4 / 4.3: visually-hidden styling.
    //
    // NOTE / LIMITATION: the off-screen rule lives in SCSS
    // (`.form-signup .honeypot-field` in src/styles/sections/_message-me.scss)
    // and is applied via a global stylesheet. The component is rendered in
    // isolation here (no compiled CSS attached to the document), so computed
    // styles cannot be asserted in this environment. We therefore assert the
    // structural hook — the `honeypot-field` class that the SCSS rule targets —
    // which is the testable contract at the markup level.
    test('wrapper carries the honeypot-field class the visually-hidden SCSS rule targets', () => {
      const wrapper = root.querySelector('.honeypot-field');
      expect(wrapper).not.toBeNull();
      expect(wrapper!.classList.contains('honeypot-field')).toBe(true);
    });
  });

  // --- DOM order (Req 5.3) --------------------------------------------------
  //
  // Req 5.3 asks for the reading order Name -> Email -> Message -> Honeypot ->
  // Submit, arranged with the existing Bootstrap row / col / col-auto grid.
  // In the Grayscale "input-group-newsletter" layout (per design.md's rendered
  // markup) the Submit button lives in the *same row* as the email input, in a
  // `col-auto` beside it — so in raw document order the button sits right after
  // the email field, not at the very end. We therefore split the assertion:
  //   1. the four input fields are in strict reading order
  //      Name -> Email -> Message -> Honeypot; and
  //   2. the Submit button is the trailing control of the Email row group
  //      (its documented placement), coming after the Email input.
  describe('DOM order', () => {
    const indexOf = (id: string): number => {
      const all = Array.from(root.querySelectorAll('*'));
      const el = root.querySelector(`#${id}`);
      expect(el, `#${id} should be present`).not.toBeNull();
      return all.indexOf(el as Element);
    };

    test('input fields are in reading order Name -> Email -> Message -> Honeypot', () => {
      const fieldIds = ['name', 'emailAddress', 'message', 'contactCompany'];
      const positions = fieldIds.map(indexOf);

      for (let i = 1; i < positions.length; i++) {
        expect(
          positions[i],
          `#${fieldIds[i]} should come after #${fieldIds[i - 1]}`,
        ).toBeGreaterThan(positions[i - 1]);
      }
    });

    test('Submit button is grouped in the Email row, after the Email input', () => {
      // The button belongs to the email row's col-auto (input-group-newsletter),
      // so it follows the email input in document order.
      expect(indexOf('submitButton')).toBeGreaterThan(indexOf('emailAddress'));

      const submit = root.querySelector('#submitButton');
      const emailRow = root.querySelector('.input-group-newsletter');
      expect(emailRow).not.toBeNull();
      expect(emailRow!.contains(submit)).toBe(true);
    });
  });

  // --- Outcome containers (Req 5.5) -----------------------------------------
  describe('Outcome containers', () => {
    test('#submitSuccessMessage and #submitErrorMessage are present with d-none', () => {
      const success = root.querySelector('#submitSuccessMessage');
      const error = root.querySelector('#submitErrorMessage');

      expect(success).not.toBeNull();
      expect(error).not.toBeNull();

      // Req 5.5: both outcome containers preserved and hidden by default.
      expect(success!.classList.contains('d-none')).toBe(true);
      expect(error!.classList.contains('d-none')).toBe(true);
    });
  });
});

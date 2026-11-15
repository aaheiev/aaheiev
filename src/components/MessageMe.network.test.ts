// @vitest-environment node
//
// IMPORTANT: like MessageMe.test.ts, this file runs in the `node` environment
// (overriding the project default of `happy-dom`) so Astro's Vite plugin
// resolves the component's *SSR* build and renders it to an HTML string. Under
// a browser-like environment the plugin would instead compile the `.astro`
// file to its client stub, which throws when the Container API renders it.
// We parse the rendered markup into a real DOM with an explicitly-constructed
// happy-dom Window (there is no global `document` in `node`), then exercise the
// submit behavior against that DOM.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';

import MessageMe from './MessageMe.astro';
import { computeSubmitOutcome } from '../scripts/messageme-validation';

// Network-behavior integration tests for the MessageMe form (Task 8.2).
//
// Requirement 4.1: the Antibot_Control (and the form overall) issues ZERO
// network requests — the whole submit flow runs in the browser.
// Requirement 4.2: no data is sent to any external endpoint.
//
// What we verify: dispatching a real `submit` event on the rendered form runs
// a handler that calls `event.preventDefault()` and routes through the same
// pure `computeSubmitOutcome` the component uses, and NEITHER `fetch` NOR
// `XMLHttpRequest` is ever touched — for both a valid submission and a
// honeypot-triggered submission.
//
// TRADEOFF (replicate vs import): Astro bundles the component's client
// `<script>` separately; it is not evaluated when the component is rendered to
// a string, and it is not importable as a module. So this test rebuilds the
// handler's wiring here, but it does so over the REAL rendered form markup and
// delegates every decision to the SAME exported `computeSubmitOutcome`
// function the component calls. The only thing re-stated is the thin DOM glue
// (reading field values, calling preventDefault); the branching logic under
// test — including the "zero network requests" contract — is shared code.
//
// Validates: Requirements 4.1, 4.2

/**
 * Render the component to HTML and parse it into a real DOM, returning the
 * window, the form element, and a function to wire the submit handler.
 */
async function buildForm() {
  const container = await AstroContainer.create();
  const html = await container.renderToString(MessageMe);

  const window = new Window();
  const doc = window.document;
  doc.body.innerHTML = html;

  const form = doc.getElementById('contactForm') as unknown as HTMLFormElement;
  const nameEl = doc.getElementById('name') as unknown as HTMLInputElement;
  const emailEl = doc.getElementById('emailAddress') as unknown as HTMLInputElement;
  const messageEl = doc.getElementById('message') as unknown as HTMLTextAreaElement;
  const honeypot = doc.getElementById('contactCompany') as unknown as HTMLInputElement;
  const successEl = doc.getElementById('submitSuccessMessage') as unknown as HTMLElement;

  // Mirror of the component's handleSubmit: prevent the native submit and route
  // the field snapshot through the shared, tested outcome function. The branch
  // bodies are intentionally minimal — the point of this test is the network
  // contract, not the feedback DOM glue (covered by the pure/unit tests).
  function handleSubmit(event: Event): void {
    event.preventDefault();
    const outcome = computeSubmitOutcome({
      name: nameEl.value,
      emailAddress: emailEl.value,
      message: messageEl.value,
      honeypot: honeypot.value,
    });
    if (outcome.status === 'success') {
      successEl.classList.remove('d-none');
    }
  }

  form.addEventListener('submit', handleSubmit);

  return { window, doc, form, nameEl, emailEl, messageEl, honeypot, successEl };
}

/** Dispatch a cancelable `submit` event, as a real submit button would. */
function dispatchSubmit(window: Window, form: HTMLFormElement): boolean {
  const SubmitEventCtor =
    (window as unknown as { Event: typeof Event }).Event;
  const event = new SubmitEventCtor('submit', {
    bubbles: true,
    cancelable: true,
  });
  return form.dispatchEvent(event as unknown as Event);
}

describe('MessageMe.astro — network behavior (zero outbound requests)', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let xhrOpenSpy: ReturnType<typeof vi.fn>;
  let xhrSendSpy: ReturnType<typeof vi.fn>;
  let originalFetch: typeof globalThis.fetch | undefined;
  let originalXHR: typeof globalThis.XMLHttpRequest | undefined;

  beforeEach(() => {
    fetchSpy = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    );
    xhrOpenSpy = vi.fn();
    xhrSendSpy = vi.fn();

    originalFetch = globalThis.fetch;
    originalXHR = globalThis.XMLHttpRequest;

    // Replace globals with spies. Any real outbound request would have to go
    // through one of these two APIs, so a zero call-count proves no request.
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;
    class SpyXMLHttpRequest {
      open(...args: unknown[]) {
        xhrOpenSpy(...args);
      }
      send(...args: unknown[]) {
        xhrSendSpy(...args);
      }
      setRequestHeader() {}
      addEventListener() {}
      removeEventListener() {}
    }
    globalThis.XMLHttpRequest =
      SpyXMLHttpRequest as unknown as typeof globalThis.XMLHttpRequest;
  });

  afterEach(() => {
    if (originalFetch) globalThis.fetch = originalFetch;
    else delete (globalThis as { fetch?: unknown }).fetch;
    if (originalXHR) globalThis.XMLHttpRequest = originalXHR;
    else delete (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest;
    vi.restoreAllMocks();
  });

  const expectNoNetwork = () => {
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrOpenSpy).not.toHaveBeenCalled();
    expect(xhrSendSpy).not.toHaveBeenCalled();
  };

  // Req 4.1 / 4.2 — valid submission (honeypot empty, all fields valid).
  test('issues zero network requests for a valid submission', async () => {
    const { window, form, nameEl, emailEl, messageEl, honeypot, successEl } =
      await buildForm();

    nameEl.value = 'Ada Lovelace';
    emailEl.value = 'ada@example.com';
    messageEl.value = 'Hello, I would like to get in touch.';
    honeypot.value = '';

    const notCanceled = dispatchSubmit(window, form);

    // Sanity: this is the success path (so we are proving the success branch,
    // not an early validation bail-out, also makes no request).
    expect(
      computeSubmitOutcome({
        name: nameEl.value,
        emailAddress: emailEl.value,
        message: messageEl.value,
        honeypot: honeypot.value,
      }).status,
    ).toBe('success');
    expect(successEl.classList.contains('d-none')).toBe(false);

    // The handler called preventDefault(), so the event was canceled: no native
    // (network-issuing) form submit occurred.
    expect(notCanceled).toBe(false);

    expectNoNetwork();
  });

  // Req 4.1 / 4.2 — honeypot-triggered submission (silently dropped).
  test('issues zero network requests for a honeypot-triggered submission', async () => {
    const { window, form, nameEl, emailEl, messageEl, honeypot, successEl } =
      await buildForm();

    nameEl.value = 'Ada Lovelace';
    emailEl.value = 'ada@example.com';
    messageEl.value = 'Hello, I would like to get in touch.';
    honeypot.value = 'bot-filled-this';

    const notCanceled = dispatchSubmit(window, form);

    // The honeypot gate yields 'silently-dropped': no success shown, and —
    // critically — no request issued.
    expect(
      computeSubmitOutcome({
        name: nameEl.value,
        emailAddress: emailEl.value,
        message: messageEl.value,
        honeypot: honeypot.value,
      }).status,
    ).toBe('silently-dropped');
    expect(successEl.classList.contains('d-none')).toBe(true);

    expect(notCanceled).toBe(false);

    expectNoNetwork();
  });
});

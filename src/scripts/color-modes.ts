/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2025 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 *
 * Adapted for TypeScript / Astro. Drives the light/dark/auto theme switcher.
 */

const getStoredTheme = (): string | null => localStorage.getItem('theme');
const setStoredTheme = (theme: string): void => localStorage.setItem('theme', theme);

const getPreferredTheme = (): string => {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const setTheme = (theme: string): void => {
  if (theme === 'auto') {
    document.documentElement.setAttribute(
      'data-bs-theme',
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    );
  } else {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }
};

// Apply the preferred theme as early as possible to avoid a flash.
setTheme(getPreferredTheme());

const showActiveTheme = (theme: string, focus = false): void => {
  const themeSwitcher = document.querySelector<HTMLElement>('#bd-theme');

  if (!themeSwitcher) {
    return;
  }

  const themeSwitcherText = document.querySelector('#bd-theme-text');
  const activeThemeIcon = document.querySelector('.theme-icon-active use');
  const btnToActive = document.querySelector<HTMLElement>(`[data-bs-theme-value="${theme}"]`);

  if (!themeSwitcherText || !activeThemeIcon || !btnToActive) {
    return;
  }

  const svgOfActiveBtn = btnToActive.querySelector('svg use')?.getAttribute('href');

  document.querySelectorAll('[data-bs-theme-value]').forEach((element) => {
    element.classList.remove('active');
    element.setAttribute('aria-pressed', 'false');
  });

  btnToActive.classList.add('active');
  btnToActive.setAttribute('aria-pressed', 'true');
  if (svgOfActiveBtn) {
    activeThemeIcon.setAttribute('href', svgOfActiveBtn);
  }
  const themeSwitcherLabel = `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`;
  themeSwitcher.setAttribute('aria-label', themeSwitcherLabel);

  if (focus) {
    themeSwitcher.focus();
  }
};

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const storedTheme = getStoredTheme();
  if (storedTheme !== 'light' && storedTheme !== 'dark') {
    setTheme(getPreferredTheme());
  }
});

window.addEventListener('DOMContentLoaded', () => {
  showActiveTheme(getPreferredTheme());

  document.querySelectorAll('[data-bs-theme-value]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const theme = toggle.getAttribute('data-bs-theme-value');
      if (!theme) {
        return;
      }
      setStoredTheme(theme);
      setTheme(theme);
      showActiveTheme(theme, true);
    });
  });
});

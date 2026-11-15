/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Extend the project's Astro/Vite config so tests share the same build
// pipeline (TypeScript, SCSS preprocessor options, etc.) as the site.
// https://docs.astro.build/en/guides/testing/#vitest
export default getViteConfig({
  test: {
    // DOM environment for component rendering / network-spy integration tests.
    environment: 'happy-dom',
    // Co-located *.test.ts files live next to the modules they cover,
    // e.g. src/scripts/messageme-validation.test.ts.
    include: ['src/**/*.{test,spec}.{ts,js}'],
    globals: true,
  },
});

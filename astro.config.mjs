// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Bootstrap 5.3's Sass still uses legacy color functions
          // (red()/green()/blue()), which Dart Sass flags as deprecated.
          // Silence those warnings since they originate in node_modules.
          silenceDeprecations: ['color-functions', 'global-builtin', 'import'],
          quietDeps: true,
        },
      },
    },
  },
});

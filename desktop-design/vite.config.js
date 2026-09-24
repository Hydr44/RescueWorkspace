import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },
  css: { preprocessorOptions: { scss: { silenceDeprecations: ['mixed-decls', 'global-builtin', 'import', 'color-functions'], quietDeps: true } } },
});

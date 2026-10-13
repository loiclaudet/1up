import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// tauri expects a fixed port and its own errors on screen. `--mode demo` builds the browser demo as one html file
// (dist-demo/index.html), the fonts inlined, which opens from the disk for screenshots
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'demo' ? [viteSingleFile()] : [])],
  clearScreen: false,
  server: { port: 5173, strictPort: true, watch: { ignored: ['**/src-tauri/**'] } },
  build: mode === 'demo' ? { outDir: 'dist-demo', assetsInlineLimit: 100_000_000 } : {},
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
}));

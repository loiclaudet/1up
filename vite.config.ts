import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// tauri expects a fixed port and its own errors on screen
export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: { port: 5173, strictPort: true, watch: { ignored: ['**/src-tauri/**'] } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});

import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    {
      name: 'reload',
      configureServer(server) {
        const { ws, watcher } = server;
        watcher.on('change', (file) => {
          if (file.endsWith('.md')) {
            ws.send({ type: 'full-reload' });
          }
        });
      },
    },
  ],
});

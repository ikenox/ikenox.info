import { reactRouter } from '@react-router/dev/vite';
import { cloudflareDevProxy } from '@react-router/dev/vite/cloudflare';
import { defineConfig } from 'vite';

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild ? { input: './workers/app.ts' } : undefined,
  },
  plugins: [
    cloudflareDevProxy({
      getLoadContext({ context }) {
        return { cloudflare: context.cloudflare };
      },
    }),
    reactRouter(),
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
}));

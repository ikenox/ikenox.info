import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['./app/blog-posts/assets/**'],

  plugins: [
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
});

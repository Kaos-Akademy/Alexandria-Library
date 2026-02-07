import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // When vercel dev runs with devCommand, it proxies frontend to Vite (5173)
  // but API routes are served by vercel dev itself on port 3000 (default)
  // Check VERCEL_PORT env var (set by vercel dev) or default to 3000
  server: {
    proxy: {
      '/api': {
        target: process.env.VERCEL_PORT 
          ? `http://localhost:${process.env.VERCEL_PORT}`
          : 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          const targetPort = process.env.VERCEL_PORT || '3000';
          console.log('[Vite Proxy] Configured to proxy /api to http://localhost:' + targetPort);
          
          proxy.on('error', (err, _req, res) => {
            console.error('[Vite Proxy] Error proxying to vercel dev:', err.message);
            console.error('[Vite Proxy] Target port:', targetPort);
            console.error('[Vite Proxy] Make sure vercel dev is running and accessible');
            if (res && 'writeHead' in res && 'headersSent' in res && typeof res.writeHead === 'function' && !res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                error: `Proxy error: vercel dev not accessible on port ${targetPort}`,
                hint: 'Check vercel dev terminal for the actual port it\'s listening on'
              }));
            }
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('[Vite Proxy] Forwarding:', req.method, req.url, '->', `http://localhost:${targetPort}${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            const contentType = proxyRes.headers['content-type'];
            console.log('[Vite Proxy] Response:', proxyRes.statusCode, req.url, contentType ? `(${contentType})` : '');
            if (contentType && contentType.includes('text/html') && req.url?.includes('/api/')) {
              console.error('[Vite Proxy] WARNING: Got HTML instead of JSON! vercel dev may not be serving API routes.');
            }
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Flow blockchain SDK - large dependency
          'flow': ['@onflow/fcl', '@onflow/react-sdk'],
          // MoonPay payment SDK
          'moonpay': ['@moonpay/moonpay-js', '@moonpay/moonpay-react'],
          // React Router
          'router': ['react-router-dom'],
          // UI libraries
          'ui': ['@radix-ui/react-dialog', 'cmdk', 'lucide-react'],
        },
      },
    },
    // Increase chunk size warning limit since we're manually chunking
    chunkSizeWarningLimit: 600,
  },
})

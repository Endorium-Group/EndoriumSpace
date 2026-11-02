// Builds the EndoriumFort Enterprise frontend as a static demo. Copied into the
// checkout's frontend/ by build.sh; the product sources are not edited, the
// rewrites below are applied at build time only.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const base = (process.env.DEMO_BASE || '/demo/').replace(/\/?$/, '/');
const shim = process.env.DEMO_SHIM; // absolute path to demo/src/shim.js
// Enterprise UI (src/pro/) when present, as in the product's own build.
const proReal = fileURLToPath(new URL('./src/pro/index.jsx', import.meta.url));
const proStub = fileURLToPath(new URL('./src/pro-stub/index.jsx', import.meta.url));
const proEntry = existsSync(proReal) ? proReal : proStub;

function demo() {
  return {
    name: 'endoriumfort-demo',
    enforce: 'pre',
    transform(code, id) {
      if (!/\/frontend\/src\/.*\.jsx?$/.test(id)) return null;
      let out = code
        // Routes are read relative to the demo's sub-path.
        .replaceAll('window.location.pathname', 'window.__efDemoPath()')
        // Absolute links and public assets get the sub-path.
        .replace(/(["'`])\/assets\//g, `$1${base}assets/`)
        .replace(/href=(["'])\/(?!\/)/g, `href=$1${base}`)
        .replace(/href=\{`\/(?!\/)/g, `href={\`${base}`)
        // Tabs opened at the app root (?files=, ?rbi=) stay under the sub-path.
        .replaceAll('${window.location.origin}/?', '${window.location.origin}' + base + '?')
        .replaceAll('window.open(`/?', 'window.open(`' + base + '?');
      if (id.endsWith('/frontend/src/main.jsx')) out = `import ${JSON.stringify(shim)};\n${out}`;
      return out === code ? null : { code: out, map: null };
    }
  };
}

export default defineConfig({
  base,
  plugins: [demo(), react()],
  resolve: { alias: { '@pro': proEntry } },
  build: { outDir: process.env.DEMO_OUT || 'dist-demo', emptyOutDir: true }
});

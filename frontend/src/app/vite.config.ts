import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  // 1. Resolve conditions (only if customized)
  resolve: {
    alias: [{ find: /^katex$/, replacement: "katex/dist/katex.mjs" }],
    // conditions: ['custom', ...defaultClientConditions]
  },
  ssr: {
    resolve: {
      // externalConditions: ['custom', ...defaultServerConditions]
    },
  },

  // 2. Build options
  build: {
    outDir: "build",
    target: "es2022", // Support for top-level await
    sourcemap: true, // Generate source maps for debugging
    // For library mode CSS naming:
    // lib: {
    //   cssFileName: 'style'
    // }
  },

  // 3. JSON plugin (optional)
  // json: {
  //   stringify: 'auto',
  //   namedExports: true
  // },

  // 4. Plugins remain the same
  plugins: [
    react(),
    svgr(),
    wasm(),
    topLevelAwait({
      // This is needed for tiktoken which uses top-level await
      promiseExportName: "__tla",
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.0.0"),
  },
  // 5. Server options for development
  server: {
    // Enable HMR with websockets
    hmr: {
      // Reduce timeout for faster updates
      timeout: 1000,
    },
    // Watch for changes in node_modules
    watch: {
      usePolling: false,
      // Include specific directories to watch
      ignored: ["**/node_modules/**", "**/dist/**"],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022", // Support for top-level await
    },
  },
});

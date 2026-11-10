import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: [
        "**/.chrome-*/**",
        "**/.npm-cache/**",
        "**/shots/**",
        "**/dist/**",
      ],
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
});

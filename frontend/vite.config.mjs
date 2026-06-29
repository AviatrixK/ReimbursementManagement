import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/rest": {
        target: "http://localhost:7002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
});

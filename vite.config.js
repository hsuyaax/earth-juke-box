import { defineConfig } from "vite";

export default defineConfig({
  build: { rollupOptions: { input: ["index.html", "calibrate.html", "about.html"] } },
});

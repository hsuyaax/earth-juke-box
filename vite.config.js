import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // relative asset paths, so the site works under a GitHub Pages subpath
  build: { rollupOptions: { input: ["index.html", "calibrate.html", "about.html"] } },
});

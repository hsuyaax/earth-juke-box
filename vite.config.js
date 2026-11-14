import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./", // relative asset paths, so the site works under a GitHub Pages subpath
  plugins: [react()], // JSX for the sleeve and liner notes only; the jukebox (play.html) stays plain JavaScript
  build: { rollupOptions: { input: ["index.html", "play.html", "notes.html", "band.html", "calibrate.html", "about.html"] } },
});

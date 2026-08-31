import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base so the built app works from any subpath — GitHub Pages
// project sites serve from /<repo-name>/, but this way it also works
// unchanged from a custom domain or Vercel/Netlify's root path.
export default defineConfig({
  base: "./",
  plugins: [react()],
});

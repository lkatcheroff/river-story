import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base relativa: funciona en GitHub Pages (/river-story/) y en cualquier hosting estático.
export default defineConfig({ base: "./", plugins: [react(), tailwindcss()] });

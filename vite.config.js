import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for the TravelMate Admin Panel
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
  },
});

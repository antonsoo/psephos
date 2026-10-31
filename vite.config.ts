import { defineConfig } from "vite";
export default defineConfig({
  base: "/psephos/",
  build: {
    target: "es2022",
    rollupOptions: { input: { ballots: "index.html", allotment: "allotment.html" } },
  },
});

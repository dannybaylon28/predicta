import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        proxy: {
            "/api/worldcup": {
                target: "https://worldcup26.ir",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/worldcup/, "/get"),
            },
        },
    },
});

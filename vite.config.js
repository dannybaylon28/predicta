import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "");
    return {
        plugins: [react()],
        server: {
            host: "0.0.0.0",
            proxy: {
                "/api/worldcup": {
                    target: "https://worldcup26.ir",
                    changeOrigin: true,
                    rewrite: function (path) { return path.replace(/^\/api\/worldcup/, "/get"); },
                },
                "/api/football-data": {
                    target: "https://api.football-data.org",
                    changeOrigin: true,
                    rewrite: function () { return "/v4/competitions/2000/matches"; },
                    headers: env.FOOTBALL_DATA_TOKEN
                        ? { "X-Auth-Token": env.FOOTBALL_DATA_TOKEN }
                        : {},
                },
            },
        },
    };
});

import type { UserConfig } from "vite";

export default {
	server: {
		proxy: {
			"/api/": {
				target: "http://localhost:4322/",
				changeOrigin: true,
				// rewrite: (path) => path.replace(/^\/api\/v1/, ""),
			},
		},
	},
	build: {
		target: "es2022",
	},
	plugins: [],
} satisfies UserConfig;

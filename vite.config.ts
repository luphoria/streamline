import type { UserConfig } from "vite";

export default {
	server: {
		port: 6767,
		strictPort: true,
		allowedHosts: ["vite.percs.dev", "streamline.luphoria.com"],
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

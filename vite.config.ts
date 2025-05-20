import type { UserConfig } from "vite";

export default {
	server: {
		port: 4321,
		strictPort: true,
		allowedHosts: ["vite.percs.dev"],
	},
	plugins: [],
} satisfies UserConfig;

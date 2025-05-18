// plugins/proxy-middleware.mjs
import { WebSocketServer } from "ws";

import { handleConn } from "./backend/chunking.mjs";

/**
 * @returns {import("astro").AstroIntegration}
 */
export default () => {
	const wss = new WebSocketServer({
		noServer: true,
	});

	return {
		name: "proxy",
		hooks: {
			"astro:server:setup": ({ server }) => {
				// Handle WebSocket upgrade
				server.httpServer.on("upgrade", (req, socket, head) => {
					if (req.url.startsWith("/getAudio"))
						wss.handleUpgrade(req, socket, head, (ws) => {
							handleConn(req, ws);
						});
				});
			},
		},
	};
};

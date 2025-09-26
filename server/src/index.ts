import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createFolderRoute } from "hono-file-router";
import { fileURLToPath } from "node:url";
import { loadSources } from "./util/loaders";
import { settings } from "../config";
import { MusicBrainzApi } from "musicbrainz-api";

const app = new Hono();
(async () => {
	app.route(
		"/",
		await createFolderRoute({
			path: fileURLToPath(new URL("routes/", import.meta.url)),
		})
	);
})();

// Fetch all sourcing modules (from sources/)
export const sourceModules = await loadSources(
	new URL("../sources/", import.meta.url)
);
export const mb = new MusicBrainzApi({
    appName: "streamline (https://github.com/luphoria/streamline)",
    appVersion: "0.0.1",
    appContactInfo: "contact@streamline.pn",
});

serve(
	{
		fetch: app.fetch,
		port: 4322,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);

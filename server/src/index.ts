import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createFolderRoute } from "hono-file-router";
import { fileURLToPath } from "node:url";
import { loadSources } from "./util/loaders";
import { settings } from "../config";
import { MusicBrainz } from "../../src/utils/MusicBrainz";

const app = new Hono();
(async () => {
	app.route(
		"/",
		await createFolderRoute({
			path: fileURLToPath(new URL("routes/", import.meta.url)),
		})
	);
	console.log(app.routes)
})();

// Fetch all sourcing modules (from sources/)
export const sourceModules = await loadSources(
	new URL("../sources/", import.meta.url)
);
export const mb = new MusicBrainz(settings.MB_URL);

serve(
	{
		fetch: app.fetch,
		port: 4322,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);

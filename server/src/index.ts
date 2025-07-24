import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createFolderRoute } from "hono-file-router";
import { fileURLToPath } from "node:url";
import { loadSources } from "./util/loaders";

const app = new Hono();
(async () => {
app.route("/", await createFolderRoute({ path: fileURLToPath(new URL("routes/", import.meta.url)) }));
})()

// Fetch all sourcing modules (from sources/)\
export const sourceModules = await loadSources(new URL("../sources/", import.meta.url))

serve(
	{
		fetch: app.fetch,
		port: 4322,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);

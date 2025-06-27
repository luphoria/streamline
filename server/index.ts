import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createFolderRoute } from "hono-file-router";

const app = new Hono();

app.route("/", await createFolderRoute({ path: "./server/routes/" }));

serve(
	{
		fetch: app.fetch,
		port: 4322,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);

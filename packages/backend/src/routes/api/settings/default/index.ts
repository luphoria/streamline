import { createHandler } from "hono-file-router";
import { settings } from "../../../../../config";

export const GET = createHandler(async (c) => {
	return c.json(settings);
});

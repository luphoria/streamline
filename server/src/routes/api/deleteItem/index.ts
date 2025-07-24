import { createHandler } from "hono-file-router";
import { GetRecording, DeleteRecording } from "../../../db/db";
import { t } from "try";
import * as fs from "fs";

export const GET = createHandler(async (c) => {
	const mbid = c.req.query("mbid");
	if (
		!mbid ||
		!mbid.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)
	) {
		return new Response("Bad MBID", { status: 400 });
	}

	console.log(`Checking DB to delete ${mbid} . . .`);
	const DBReq = GetRecording(mbid);
	console.log(DBReq);
	if (!DBReq) {
		return new Response("Not Found", {
			status: 404,
		});
	}
	console.log(`File in cache: ${DBReq.filepath}\nDeleting ${mbid}. . .`);
	// TODO: download anyway if flag is fixed to try specific source that isn't cached or if some kind of force flag sent
	DeleteRecording(mbid);
	// TODO: Maybe make this optional?
	console.log(`Deleting ${DBReq.filepath} . . .`);
	const result = await t(() => fs.unlinkSync(DBReq.filepath));
	if (!result.ok) {
		return new Response(`${result.error}`, {
			status: 500,
		});
	}
	console.log("Deleted.");

	return new Response(mbid, { status: 200 });
});

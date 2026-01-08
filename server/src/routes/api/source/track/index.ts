import fs from "node:fs";
import { Readable } from "node:stream";
import { createHandler } from "hono-file-router";
import { stream } from "hono/streaming";
import { t } from "try";
import { AddRecording, DeleteRecording, GetRecording } from "../../../../db/db";
import { sourceModules, mb } from "../../../../index";
import mime from "mime";
import { Context } from "hono";
import { Source } from "../../../../structures/sources";

function createStreamingResponse(c: Context, filePath: string) {
	const response = stream(c, async (stream) => {
		const fileStream = Readable.toWeb(
			fs.createReadStream(filePath)
		) as ReadableStream<Uint8Array>;

		await stream.pipe(fileStream);
	});
	const fileType = mime.getType(filePath);
	if (fileType) response.headers.set("Content-Type", fileType);

	return response;
}
export const GET = createHandler(async (c) => {
	const mbid = c.req.query("mbid");
	if (
		!mbid ||
		!mbid.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)
	) {
		return new Response("Bad MBID", { status: 400 });
	}
	const recordingInfo = await mb.lookup("recording", mbid, [
		"artist-credits",
		"releases",
	]);
	console.log(recordingInfo);
	// TODO: sort related releases, pass selected release to scraper (for sorting responses), pass other listed artist credits (for filtering and sorting)
	const artist = recordingInfo["artist-credit"][0].name;
	const songTitle = recordingInfo.title;
	const keywords = recordingInfo.releases[0]
		? recordingInfo.releases[0].title
		: "";
	console.log(artist, songTitle);

	const sources = c.req.query("sources")?.split(",") || "";

	console.log("Checking DB for MBID . . .");
	const DBReq = GetRecording(mbid);
	console.log(DBReq);
	if (DBReq) {
		console.log(`File already in cache: ${DBReq.filepath}`);
		// TODO: download anyway if flag is fixed to try specific source that isn't cached or if some kind of force flag sent

		return createStreamingResponse(c, DBReq.filepath);
	}

	async function SearchAndDownload(source: Source | undefined) {
		if (!source) return null;
		const searchResults = await t(source.Search(artist, songTitle, keywords));
		if (!searchResults.ok) {
			return null;
		}

		let tries = source.tries ? source.tries : 3;
		if (searchResults.length < tries) tries = searchResults.length;

		for (let i = 0; i < tries; i++) {
			const filePath = await t(source.Download(searchResults[i]));
			if (!filePath.ok) continue;
			console.log(
				`${source.Name}: File ${artist} - ${songTitle} successfully downloaded!`
			);

			return filePath.value;
		}

		return null;
	}

	let filePath: string | null = null;
	let usedSource: string = "unknown";
	for (const source of sources) {
		filePath = await SearchAndDownload(sourceModules.get(source));
		if (filePath) {
			usedSource = source;
			break;
		}
	}

	if (!filePath) {
		return c.json(
			{
				success: false,
				message: "No sources were able to handle your request :(",
			},
			{
				status: 404,
			}
		);
	}

	AddRecording(
		mbid,
		filePath,
		usedSource,
		recordingInfo["artist-credit"]!,
		songTitle,
		"placeholder 3:",
		recordingInfo["first-release-date"]
	);

	return createStreamingResponse(c, filePath);
});

export const DELETE = createHandler(async (c) => {
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
		return c.json(
			{
				success: false,
				message: "The track was not found in the cache database.",
			},
			{
				status: 404,
			}
		);
	}
	console.log(`File in cache: ${DBReq.filepath}\nDeleting ${mbid}. . .`);
	// TODO: download anyway if flag is fixed to try specific source that isn't cached or if some kind of force flag sent
	DeleteRecording(mbid);
	// TODO: Maybe make this optional?
	/*
	console.log(`Deleting ${DBReq.filepath} . . .`);
	const result = await t(() => fs.unlinkSync(DBReq.filepath));
	if (!result.ok) {
		return new Response(`${result.error}`, {
			status: 500,
		});
	}
		*/
	console.log("Deleted.");

	return new Response(mbid, { status: 200 });
});

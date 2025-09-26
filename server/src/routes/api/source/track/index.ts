import fs from "node:fs";
import { Readable } from "node:stream";
import { createHandler } from "hono-file-router";
import { stream } from "hono/streaming";
import { Result, t } from "try";
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
	const recordingInfo = await mb.lookup("recording", mbid, ["artist-credits", "releases"])
	console.log(recordingInfo)
	// TODO: sort related releases, pass selected release to scraper (for sorting responses), pass other listed artist credits (for filtering and sorting)
	const artist = recordingInfo["artist-credit"][0].name;
	const songTitle = recordingInfo.title;
	const keywords = recordingInfo.releases[0]
		? recordingInfo.releases[0].title
		: "";
	console.log(artist, songTitle)

	const source = c.req.query("source") || "";

	console.log("Checking DB for MBID . . .");
	const DBReq = GetRecording(mbid);
	console.log(DBReq);
	if (DBReq) {
		console.log(`File already in cache: ${DBReq.filepath}`);
		// TODO: download anyway if flag is fixed to try specific source that isn't cached or if some kind of force flag sent

		return createStreamingResponse(c, DBReq.filepath);
	}

	async function SearchAndDownload(source: Source) {
		const searchResults = await source.Search(
			artist,
			songTitle,
			keywords
		);

		// sort results...
		console.log("haiaiai :3", searchResults, searchResults.length);

		let tries = source.tries ? source.tries : 3;
		if (searchResults.length < tries) tries = searchResults.length;

		for (let i = 0; i < tries; i++) {
			const filePath = await t(source.Download(searchResults[i]));
			console.log(filePath.ok, filePath.error);
			if (filePath.ok) {
				console.log(
					`${source.Name}: File ${artist} - ${songTitle} successfully downloaded!`
				);

				return filePath.value;
			}
		}

		return null;
	}
	
	const preferredSource = sourceModules.get(source);
	let filePath: string | null = null;
	let usedSource = "";
	if (preferredSource) {
		usedSource = source[0]
		filePath = await SearchAndDownload(preferredSource);
	}
	if (!filePath) {
		for (const source of sourceModules) {
			if (source[0] === usedSource) continue;
			usedSource = source[0]
			filePath = await SearchAndDownload(source[1]);
			if (filePath) break;
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
	};
	
	AddRecording(
		mbid,
		filePath,
		usedSource,
		recordingInfo["artist-credit"],
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
		return new Response("Not Found", {
			status: 404,
		});
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

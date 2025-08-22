import fs from "node:fs";
import { Readable } from "node:stream";
import { createHandler } from "hono-file-router";
import { stream } from "hono/streaming";
import { Result, t } from "try";
import { AddRecording, DeleteRecording, GetRecording } from "../../../../db/db";
import { sourceModules, mb } from "../../../../index";
import mime from "mime";
import { Context } from "hono";

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
	const recordingInfo = await mb.RecordingInfo(mbid);
	// TODO: sort related releases, pass selected release to scraper (for sorting responses), pass other listed artist credits (for filtering and sorting)
	const artist = recordingInfo.artists[0].name;
	const songTitle = recordingInfo.title;
	const keywords = recordingInfo.releases[0]
		? recordingInfo.releases[0].title
		: "";
	console.log(keywords);

	const source = c.req.query("source") || "";
	let filePath: Result<string> | undefined;

	console.log("Checking DB for MBID . . .");
	const DBReq = GetRecording(mbid);
	console.log(DBReq);
	if (DBReq) {
		console.log(`File already in cache: ${DBReq.filepath}`);
		// TODO: download anyway if flag is fixed to try specific source that isn't cached or if some kind of force flag sent

		return createStreamingResponse(c, DBReq.filepath);
	}

	const preferredSource = sourceModules.get(source);
	const usedSources: string[] = [];
	// Prioritize client-specified src

	if (preferredSource) { 
		const searchResults = await preferredSource.Search(
			artist,
			songTitle,
			keywords
		);

		// sort results...
		console.log("haiaiai :3", searchResults, searchResults.length);

		let tries = preferredSource.tries ? preferredSource.tries : 3;
		if (searchResults.length < tries) tries = searchResults.length;

		for (let i = 0; i < tries; i++) {
			filePath = await t(preferredSource.Download(searchResults[i]));
			console.log(filePath.ok, filePath.error)
			if (filePath && filePath.ok) {
				console.log(`${preferredSource.Name}: File ${artist} - ${songTitle} successfully downloaded!`)
				AddRecording(mbid, filePath.value, source, recordingInfo.artists, songTitle, recordingInfo.releases[0].releaseGroup, recordingInfo.releaseDate)
				break;
			}
		}
	}

	if (!filePath || !filePath.ok) {
		usedSources.push(source);
		console.log("Source not yet OK");
		// Go by order
		for (const source of sourceModules) {
			if (usedSources.includes(source[0])) continue;
			const module = source[1];
			const searchResults = await module.Search(artist, songTitle, keywords);

			// sort results...
			console.log(searchResults);

			let tries = module.tries ? module.tries : 1;
			if (searchResults.length < tries) tries = searchResults.length;

			for (let i = 0; i < tries; i++) {
				filePath = await t(module.Download(searchResults[i]));
				if (filePath) if (filePath.ok) {
					console.log(`${source[1].Name}: File ${artist} - ${songTitle} successfully downloaded!`)
					AddRecording(mbid, filePath.value, source[1].Name, recordingInfo.artists, songTitle, recordingInfo.releases[0].releaseGroup, recordingInfo.releaseDate);
					break;
				}
			}

			if (filePath && filePath.ok) {
				break;
			}

			console.log("Trying another source . . . ");
		}
	}

	if (!filePath || !filePath.ok) {
		return new Response("No sources were able to handle your request :(", {
			status: 404,
		});
	}

	return createStreamingResponse(c, filePath.value);
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

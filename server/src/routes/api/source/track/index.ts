import fs from "node:fs";
import { Readable } from "node:stream";
import { createHandler } from "hono-file-router";
import { stream } from "hono/streaming";
import { Result, t } from "try";
import { AddRecording, GetRecording } from "../../../../db/db";
import { sourceModules } from "../../../../index"
import { MusicBrainz } from "../../../../../../src/utils/MusicBrainz";
import mime from "mime";
import { MB_URL, sources } from "../../../../../.env";

export const GET = createHandler(async (c) => {
	const mbid = c.req.query("mbid");
	if (
		!mbid ||
		!mbid.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)
	) {
		return new Response("Bad MBID", { status: 400 });
	}

	// Get song info by MBID
	const mb = new MusicBrainz(MB_URL);
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

		return stream(c, async (stream) => {
			const fileStream = Readable.toWeb(
				fs.createReadStream(DBReq.filepath)
			) as ReadableStream<Uint8Array>;
			
			await stream.pipe(fileStream);
		});
	}

	const preferredSource = sourceModules.get(source)
	const usedSources: string[] = []
	// Prioritize client-specified src
	if (preferredSource) {
		const searchResults = await preferredSource.Search(artist, songTitle, keywords);

		// sort results...
		console.log(searchResults);
		// TODO: have a number of different tries for results in .env and retry them here 

		filePath = await t(
			preferredSource.Download(searchResults[0])
		);
		
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		filePath.ok ? AddRecording(mbid, filePath.value, source) : usedSources.push(source)
	}

	if (!filePath || !filePath.ok) {
		console.log("Source not yet OK");
		// Go by order
		for (const source of sourceModules) {
			if (usedSources.includes(source[0])) continue;
			const module = source[1]
			const searchResults = await module.Search(artist, songTitle, keywords);

			// sort results...
			console.log(searchResults);
	
			filePath = await t(
				module.Download(searchResults[0])
			);
			if (filePath.ok) {
				AddRecording(mbid, filePath.value, source[0]);
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
	
	const response = stream(c, async (stream) => {
		const fileStream = Readable.toWeb(
			fs.createReadStream(filePath.value)
		) as ReadableStream<Uint8Array>;

		await stream.pipe(fileStream);
	});
	const fileType = mime.getType(filePath.value)
	if (fileType) response.headers.set("Content-Type", fileType)

	return response;
});

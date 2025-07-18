import fs from "node:fs";
import { Readable } from "node:stream";
import { createHandler } from "hono-file-router";
import { stream } from "hono/streaming";
import { t } from "try";
import { GetRecording } from "../../../../db/db.js";
import { MusicBrainz } from "../../../../../src/utils/MusicBrainz.js";
import { MB_URL, sources } from "../../../../../.env.js";

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
	let filePath;

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

	// Fetch all sourcing modules (from .env.js)
	const sourceModules = {};

	for (const source in sources) {
		// Dynamically import each module by its path. (Does the file:/// uri work x-platform?)
		sourceModules[sources[source].name] = (
			await import(`file:///${sources[source].path}`)
		);
	}

	// Prioritize client-specified src
	if (sourceModules[source]) {
		let searchResults = await sourceModules[source].Search(artist, songTitle, keywords);

		// sort results...
		// TODO: have a number of different tries for results in .env and retry them here 

		filePath = await t(
			sourceModules[source].Download(searchResults[0], mbid)
		);
		if (!filePath.ok) delete sourceModules[source];
		console.log(filePath.error)
	}

	if (!filePath || !filePath.ok) {
		console.log("Source not yet OK");
		// Go by order
		for (const source in sourceModules) {
			let searchResults = await sourceModules[source].Search(artist, songTitle, keywords);

			// sort results...
			console.log(searchResults);
	
			filePath = await t(
				sourceModules[source].Download(searchResults[0], mbid)
			);
			if (filePath.ok) break;
			console.log("Trying another source . . . ");
		}
	}

	if (!filePath.ok) {
		return new Response("No sources were able to handle your request :(", {
			status: 404,
		});
	}

	return stream(c, async (stream) => {
		const fileStream = Readable.toWeb(
			fs.createReadStream(filePath.value)
		) as ReadableStream<Uint8Array>;

		await stream.pipe(fileStream);
	});
});

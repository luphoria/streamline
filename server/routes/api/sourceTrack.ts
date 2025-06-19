import fs from "node:fs";
import { pipeline } from "node:stream/promises";

import type { Handler } from "express";
import { t } from "try";
import { GetRecording } from "../../db/db";
import { MusicBrainz } from "../../../src/utils/MusicBrainz"
import { MB_URL, sources } from "../../../.env.js"

export const get: Handler = async (req, res, next) => {
	console.log(req.originalUrl);
	const url = new URL(req.url, "https://streamline.invalid");

	const searchParams = new URLSearchParams(url.search);

	const mbid = decodeURIComponent(searchParams.get("mbid"));

	// Only accept requests with a valid MBID
	if (!mbid.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)) {
		return res
		.status(400)
		.send("Bad MBID");
	}

	// Get song info by MBID
	const mb = new MusicBrainz(MB_URL);
	const recordingInfo = await mb.RecordingInfo(mbid);
	// TODO: sort related releases, pass selected release to scraper (for sorting responses), pass other listed artist credits (for filtering and sorting)
	const artist = recordingInfo.artists[0].name;
	const songTitle = recordingInfo.title;
	console.log(recordingInfo);
	const keywords = recordingInfo.releases[0] ? recordingInfo.releases[0].title : "";
	console.log(keywords);

	const source = decodeURIComponent(searchParams.get("source"));
	let stream;
	let usedSource;

	console.log("Checking DB for MBID . . .");
	const DBReq = GetRecording(mbid);
	console.log(DBReq);
	if (DBReq) {
		console.log(`File already in cache: ${DBReq.filepath}`);
		// TODO: download anyway if flag is fixed to try specific source that isn't cached or if some kind of force flag sent

		stream = await t(() => fs.createReadStream(DBReq.filepath));
		usedSource = "cache";
	} else {
		// Fetch all sourcing modules (from .env.js)
		let sourceModules = {};

		for (let src in sources) {
			// Dynamically import each module by its path. (Does the file:/// uri work x-platform?)
			sourceModules[sources[src].name] = (await import(`file:///${sources[src].path}`)).default
		}

		// Prioritize client-specified src
		if (sourceModules[source]) {
			stream = await t(sourceModules[source](artist, songTitle, mbid, keywords));
			if (!stream.ok) delete sourceModules[source];
		}

		if (!stream || !stream.ok) {
			console.log("Stream not yet OK");
			// Go by order
			for (let src in sourceModules) {
				stream = await t(sourceModules[src](artist, songTitle, mbid, keywords));
				if (stream.ok) break;
				console.log("Trying another source . . . ");
			}
		}
	}

	if (!stream.ok) {
		return res
		.status((stream.error as Response).status)
		.send(await (stream.error as Response).text());
	}

	return await pipeline(stream.value, res);
};

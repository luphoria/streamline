import type { Handler } from "express";
import { t } from "try";
import { GetRecording } from "../../db/db";
import { MusicBrainz } from "../../../src/utils/MusicBrainz";
import { sources } from "../../../.env.js";

export const get: Handler = async (req, res, next) => {
	console.log(req.originalUrl);
	const url = new URL(req.url, "https://streamline.invalid");

	const searchParams = new URLSearchParams(url.search);

	const mbid = decodeURIComponent(searchParams.get("mbid"));

	// Only accept requests with a valid MBID
	if (
		!mbid.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)
	) {
		return res.status(400).send("Bad MBID");
	}

	// Get release info by MBID
	const mb = new MusicBrainz("https://musicbrainz.org/ws/2/");
	const releaseInfo = await mb.ReleaseInfo(mbid);
	console.log(releaseInfo);
	const source = decodeURIComponent(searchParams.get("source"));

	let tracks = {};

	for (const track in releaseInfo.trackList) {
		const query = `${releaseInfo.artists[0].name} - ${releaseInfo.trackList[track].title}`;

		let usedSource;

		console.log("Checking DB for MBID . . .");
		const DBReq = GetRecording(releaseInfo.trackList[track].mbid);
		console.log(DBReq);

		if (DBReq) {
			usedSource = "cache";
			console.log(`File already in cache: ${DBReq.filepath}`);

			tracks[releaseInfo.trackList[track].title] = {
				mbid: releaseInfo.trackList[track].mbid,
				source: DBReq.source,
				usedSource: usedSource,
				success: true,
			};
		} else {
			// Fetch all sourcing modules (from .env.js)
			let sourceModules = {};

			for (let src in sources) {
				// Dynamically import each module by its path. (Does the file:/// uri work x-platform?)
				sourceModules[sources[src].name] = (
					await import(`file:///${sources[src].path}`)
				).default;
			}

			let stream;
			// Prioritize client-specified src
			usedSource = source;
			// TODO: Make a function that fetches the song but doesn't return a stream
			stream = await t(sourceModules[source](query, releaseInfo.trackList[track].mbid));
			if (!stream.ok) {
				delete sourceModules[source];
				console.log("Stream not yet OK");
				// Go by order
				for (let src in sourceModules) {
					usedSource = src;
					stream = await t(sourceModules[src](query, releaseInfo.trackList[track].mbid));
					if (stream.ok) {
						break;
					}
					console.log("Trying another source . . . ");
				}
			}

			tracks[releaseInfo.trackList[track].title] = {
				mbid: releaseInfo.trackList[track].mbid,
				source: usedSource,
				usedSource: usedSource,
				success: stream.ok ? true : false,
			};
		}
	}

	console.log(tracks);

	return res.status(200).send(JSON.stringify(tracks));
};

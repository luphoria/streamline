import { createHandler } from "hono-file-router";
import { t } from "try";
import { GetRecording } from "../../../db/db";
import { MusicBrainz } from "../../../../src/utils/MusicBrainz.js";
import { MB_URL, sources } from "../../../../.env.js";

export const GET = createHandler(async (c) => {
	const mbid = c.req.query("mbid");
	if (
		!mbid ||
		!mbid.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)
	) {
		return new Response("Bad MBID", { status: 400 });
	}

	// Get release info by MBID
	const mb = new MusicBrainz(MB_URL);
	const releaseInfo = await mb.ReleaseInfo(mbid);
	const source = c.req.query("source") || "";

	const tracks = {};

	for (const track in releaseInfo.trackList) {
		const artist = releaseInfo.artists[0].name;
		const songTitle = releaseInfo.trackList[track].title;

		const keywords = releaseInfo.title;

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
			continue;
		}
		// Fetch all sourcing modules (from .env.js)
		const sourceModules = {};

		for (const source in sources) {
			// Dynamically import each module by its path. (Does the file:/// uri work x-platform?)
			sourceModules[sources[source].name] = (
				await import(`file:///${sources[source].path}`)
			).default;
		}

		let stream;
		// Prioritize client-specified src
		usedSource = source;
		// TODO: Make a function that fetches the song but doesn't return a stream
		stream = await t(
			sourceModules[source](
				artist,
				songTitle,
				releaseInfo.trackList[track].mbid,
				keywords
			)
		);
		if (!stream.ok) {
			delete sourceModules[source];
			console.log("Stream not yet OK");
			// Go by order
			for (const source in sourceModules) {
				usedSource = source;
				stream = await t(
					sourceModules[source](
						artist,
						songTitle,
						releaseInfo.trackList[track].mbid,
						keywords
					)
				);
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

	console.log(tracks);

	return c.json(tracks);
});

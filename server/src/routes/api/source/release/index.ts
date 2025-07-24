import { createHandler } from "hono-file-router";
import { t } from "try";
import { AddRecording, GetRecording } from "../../../../db/db";
import { MusicBrainz } from "../../../../../../src/utils/MusicBrainz";
import { MB_URL } from "../../../../../.env";
import { sourceModules } from "../../../../index";

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

		let stream;
		// Prioritize client-specified src
		usedSource = source;

		const searchResults = await sourceModules[source].Search(artist, songTitle, keywords);

		// sort results

		stream = await t(
			sourceModules[source].Download(searchResults[0], releaseInfo.trackList[track].mbid)
		);

		if (!stream.ok) {
			delete sourceModules[source];
			console.log("Stream not yet OK");
			// Go by order
			for (const source in sourceModules) {
				usedSource = source;
				console.log(`Trying source ${usedSource} . . . `)
				const searchResults = await sourceModules[source].Search(artist, songTitle, keywords);

				// sort results
		
				stream = await t(
					sourceModules[source].Download(searchResults[0], releaseInfo.trackList[track].mbid)
				);
				if (stream.ok) {
					AddRecording(mbid, stream.value, source);
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

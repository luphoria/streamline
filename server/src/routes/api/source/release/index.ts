import { createHandler } from "hono-file-router";
import { t } from "try";
import { AddRecording, GetRecording } from "../../../../db/db";
import { sourceModules, mb } from "../../../../index";
//TODO: redo the like whole implementation of this
export const GET = createHandler(async (c) => {
	const mbid = c.req.query("mbid");
	if (
		!mbid ||
		!mbid.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)
	) {
		return new Response("Bad MBID", { status: 400 });
	}
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

		const searchResults = await sourceModules[source].Search(
			artist,
			songTitle,
			keywords
		);

		// sort results

		let tries = sourceModules[source].tries ? sourceModules[source].tries : 3;
		if (searchResults.length < tries) tries = searchResults.length;

		for (let i = 0; i < tries; i++) {
			stream = await t(
				sourceModules[source].Download(searchResults[i]),
				releaseInfo.trackList[track].mbid
			);
			if (stream) if (stream.ok) break;
		}

		if (!stream.ok) {
			delete sourceModules[source];
			console.log("Stream not yet OK");
			// Go by order
			for (const source in sourceModules) {
				usedSource = source;
				console.log(`Trying source ${usedSource} . . . `);
				const searchResults = await sourceModules[source].Search(
					artist,
					songTitle,
					keywords
				);

				// sort results

				let tries = sourceModules[source].tries
					? sourceModules[source].tries
					: 1;
				if (searchResults.length < tries) tries = searchResults.length;

				for (let i = 0; i < tries; i++) {
					stream = await t(
						sourceModules[source].Download(searchResults[i]),
						releaseInfo.trackList[track].mbid
					);
					if (stream) if (stream.ok) break;
				}

				if (stream.ok) {
					AddRecording(
						releaseInfo.trackList[track].mbid,
						stream.value,
						source,
						[releaseInfo.artists[0]],
						songTitle,
						mbid,
						releaseInfo.releaseDate
					);
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

import fs from "node:fs";
import { qobuz } from "../.env";

export const Name = "qobuz";
export const friendlyName = "Qobuz";
export const tries = qobuz.tries ? qobuz.tries : 2;

export async function Search(queryArtist, queryTitle, albumTitle?, length?) {
	const searchQuery = `${queryArtist} - ${queryTitle}`;
	const searchResults = [];

	queryArtist = queryArtist.replaceAll(/[()[\].!?/’'"]/g, "").toLowerCase();
	queryTitle = queryTitle.replaceAll(/[()[\].!?/’'"]/g, "").toLowerCase();
	albumTitle = albumTitle.replaceAll(/[()[\].!?/’'"]/g, "").toLowerCase();

	let resultsClean: {
		artist: string;
		title: string;
		albumTitle: string;
		released: Date;
		duration: number;
		id: number;
	}[] = [];
	let totalResults = 999;

	while (searchResults.length < totalResults) {
		console.log(
			`Searching for ${searchQuery} (${searchResults.length} results) . . . `
		);
		await new Promise((r) => setTimeout(r, 300));
		const searchReq = await fetch(
			`${qobuz.qobuzDlUrl}/api/get-music?q=${encodeURIComponent(searchQuery)}&offset=${searchResults.length}`,
			{
				headers: {
					accept: "application/json, text/plain, */*",
				},
				method: "GET",
			}
		);

		const searchData = await searchReq.json();
		const reqResults = searchData.data.tracks.items;

		totalResults = searchData.data.tracks.total;
		if (totalResults > 25) totalResults = 25;

		for (const result in reqResults) {
			searchResults.push(reqResults[result]);
		}
	}

	for (const result in searchResults) {
		resultsClean.push({
			artist: searchResults[result].performer.name
				.replaceAll(/[()[\].!?/’'"]/g, "")
				.toLowerCase(),
			title: searchResults[result].title
				.replaceAll(/[()[\].!?/’'"]/g, "")
				.toLowerCase(),
			albumTitle: searchResults[result].album.title
				.replaceAll(/[()[\].!?/’'"]/g, "")
				.toLowerCase(),
			released: new Date(searchResults[result].release_date_original),
			duration: searchResults[result].duration,
			id: searchResults[result].id,
		});
	}

	resultsClean = resultsClean.filter((result) => {
		return result.artist == queryArtist;
	});
	resultsClean = resultsClean.filter((result) => {
		return result.title == queryTitle;
	});

	console.log(resultsClean);

	if (albumTitle) {
		console.log("Filtering by album: " + albumTitle);
		const _resultsClean = resultsClean;
		// release
		resultsClean = resultsClean.filter((result) => {
			return (
				result.albumTitle.includes(albumTitle) ||
				albumTitle.includes(result.albumTitle)
			);
		});
		if (resultsClean.length == 0) resultsClean = _resultsClean; // Failsafe
	}
	if (length) {
		console.log("Sorting length");
		// duration (seconds)
		resultsClean = resultsClean.sort((a, b) => {
			return (
				Math.abs(parseInt(length) - a.duration) -
				Math.abs(parseInt(length) - b.duration)
			);
		});
	}

	for (const result in resultsClean) console.log(resultsClean[result]);

	return resultsClean;
}

export async function Download(searchResult) {
	let data = await fetch(
		`${qobuz.qobuzDlUrl}/api/download-music?track_id=${searchResult.id}&quality=27`,
		{
			headers: {
				accept: "application/json, text/plain, */*",
			},
			method: "GET",
		}
	);

	data = await data.json();
	const streamUrl = data["data"]["url"];

	const response = await fetch(streamUrl, {
		method: "GET",
	});
	const stream = await response.arrayBuffer();

	const filePath = qobuz.path + searchResult.id + ".flac";

	await fs.writeFileSync(filePath, await Buffer.from(stream));

	return filePath;
}

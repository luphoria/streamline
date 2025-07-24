const prompt = require("prompt-sync")();
const fs = require("fs");

const QOBUZ_DL_API_URL = "https://eu.qobuz.squid.wtf";

const qobuz = async (query) => {
	query = query.split("|");
	let queryArtist = query[0];
	let queryTitle = query[1];
	let searchQuery = `${queryArtist} - ${queryTitle}`;
	let searchResults = [];
	let resultsClean = [];
	let totalResults = 999;

	while (searchResults.length < totalResults) {
		console.log(
			`Searching for ${searchQuery} (${searchResults.length} results) . . . `
		);
		await new Promise((r) => setTimeout(r, 1000));
		const searchReq = await fetch(
			`${QOBUZ_DL_API_URL}/api/get-music?q=${encodeURIComponent(searchQuery)}&offset=${searchResults.length}`,
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

		for (let result in reqResults) {
			searchResults.push(reqResults[result]);
		}
	}

	for (let result in searchResults) {
		resultsClean.push({
			artist: searchResults[result].performer.name,
			title: searchResults[result].title,
			albumTitle: searchResults[result].album.title,
			released: new Date(searchResults[result].release_date_original),
			duration: searchResults[result].duration,
			id: searchResults[result].id,
		});
	}

	console.log(searchResults[0]);

	resultsClean = resultsClean.filter((result) => {
		return result.artist == queryArtist;
	});
	resultsClean = resultsClean.filter((result) => {
		return result.title == queryTitle;
	});
	if (query[2]) {
		// release
		resultsClean = resultsClean.filter((result) => {
			return result.albumTitle == query[2];
		});
	}
	if (query[3]) {
		// duration (seconds)
		resultsClean = resultsClean.sort((a, b) => {
			return (
				Math.abs(parseInt(query[3]) - a.duration) -
				Math.abs(parseInt(query[3]) - b.duration)
			);
		});
	}

	for (let result in resultsClean) console.log(resultsClean[result]);

	console.log(resultsClean[0]);

	// // // // Get url // // //

	let data = await fetch(
		`${QOBUZ_DL_API_URL}/api/download-music?track_id=${resultsClean[0].id}&quality=27`,
		{
			headers: {
				accept: "application/json, text/plain, */*",
			},
			method: "GET",
		}
	);

	data = await data.json();
	let streamUrl = data.data.url;

	let stream = await fetch(streamUrl, {
		method: "GET",
	});
	stream = await stream.arrayBuffer();

	await fs.writeFileSync(
		`tests/qobuz/${resultsClean[0].id}`,
		await Buffer.from(stream)
	);
	return resultsClean[0].id;
};

console.log("Format: ARTIST|TITLE|RELEASE?|DURATION (seconds)?");
let query = prompt("Enter query: ");

const search = qobuz(query);
//The Beatles|Oh! Darling|Abbey Road|207

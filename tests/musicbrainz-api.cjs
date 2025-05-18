// Tests: request the MusicBrainz and Cover Art Archive APIs.
// CLI or paste in a web console.

// TODO: Set MusicBrainz server to a locally hosted mirror (psql).
// TODO: See if Cover Art Archive IA urls change.
// TODO: See rate limiting in Cover Art Archive.

const prompt = require("prompt-sync")();

const API = "https://musicbrainz.org/ws/2/";

const search = async (queryType, queryData) => {
	let req =
		API +
		`${queryType}/?query=${encodeURIComponent(queryData)}&limit=5&fmt=json`;
	let res = await fetch(req, {
		headers: {
			// Any UA works but you need some kind of contact information.
			// We are lying in this UA.
			"User-Agent": "python-musicbrainz/0.7.3 ( john.pork42@gmail.com )",
		},
	});
	console.info(req);
	return res.json();
};

const fetchCoverArt = async (mbid) => {
	let res = await fetch(`https://coverartarchive.org/release/${mbid}`);
	return res.json();
};

const queryType = prompt("Pick a query type (`artist`, `release`, ...?): ");
const queryData = prompt("Enter search: ");

search(queryType, queryData).then((data) => {
	console.info("=== RESULTS ===");
	for (let i in data["releases"]) {
		let releaseTitle = data["releases"][i]["title"];
		let releasePrimaryArtist = data["releases"][i]["artist-credit"][0]["name"]; // TODO: iter through all artists - we probably also want their MBID.
		let releaseDate = data["releases"][i]["date"];
		let releaseCountry = data["releases"][i]["country"];
		let coverThumbUrl = `https://archive.org/download/mbid-${data["releases"][i]["id"]}/__ia_thumb.jpg`;

		console.info(`
                ${parseInt(i) + 1}:
                 - ${releasePrimaryArtist} - ${releaseTitle} [${releaseDate} (${releaseCountry})]
                 - ${coverThumbUrl}`);
	}
	// We don't need to use the Cover Art Archive for the 180x180 images.
	// const chosenItem = prompt("Pick one to attempt to show cover art (0-4): ");
	// fetchCoverArt(data["releases"][parseInt(chosenItem)]["id"]).then(coverData => { console.info(coverData["images"][0]["image"]) })
});

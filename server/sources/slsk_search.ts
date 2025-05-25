// Search soulseek with ARTIST - TITLE

import { slskd } from "../../.env.js";

// Create a search in slskd
const CreateSearch = async (query) => {
	const response = await fetch(`${slskd.url}/api/v0/searches`, {
		method: "POST",
		body: JSON.stringify({
			searchText: query,
		}),
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"X-API-Key": slskd.apikey,
		},
	});
	const data = await response.json();

	return {
		query: data.searchText,
		id: data.id,
	};
};

// Check that search status
const AwaitSearchCompletion = async (id) => {
	const searchStarted = Date.now();
	while (true) {
		const response = await fetch(`${slskd.url}/api/v0/searches/${id}`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-API-Key": slskd.apikey,
			},
		});
		const data = await response.json();
		process.stdout.write(
			`\rAwaiting search completion for ${id} (${data.responseCount} responses). . .`
		);
		// TODO: data.responseCount cutoff and timeout/response count before timeout could be configurable?
		if (
			data.isComplete ||
			data.responseCount > 75 ||
			(data.responseCount > 5 && Date.now() - searchStarted >= 10000)
		) {
			// Stop the search prematurely if it's still going
			await fetch(`${slskd.url}/api/v0/searches/${id}`, {
				method: "PUT",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"X-API-Key": slskd.apikey,
				},
			});
			break;
		}
		// repeat until finished
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	console.log("\n== Search Completed ==");

	// TODO: If there are 0 responses, return & quit
	return {
		id: id,
		isComplete: true,
	};
};

// Retrieve search responses
const SearchResponses = async (id) => {
	const response = await fetch(`${slskd.url}/api/v0/searches/${id}/responses`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"X-API-Key": slskd.apikey,
		},
	});
	const data = await response.json();
	// console.log(data);

	return data;
};

export default async function (query, mbid) {
	console.log(`MBID ${mbid}`);
	let search;
	try {
		search = await CreateSearch(query);
		await AwaitSearchCompletion(search.id);
	} catch (err) {
		return new Response(`Search error: ${err}`, { status: 500 });
	}
	// TODO: find a better way to avoid this race condition.
	await new Promise((resolve) => setTimeout(resolve, 250));
	let searchRes = await SearchResponses(search.id);

	if (searchRes.length == 0)
		return new Response("No search results :-(", { status: 404 });

	// console.log(searchRes);

	// Move this out of the loop to avoid unnecessary computation
	const cleanQuerySongTitle = query
		.split(" - ")[1]
		.toLowerCase()
		.replace(/[^0-9a-z]/gi, ""); // todo: edge cases?

	// We should probably move this search logic to another file since we will probably make out own ranking algorith at some point
	// Filter files per result
	for (const response in searchRes) {
		// A lot of bootleg/remixes are on soulseek, this will remove them from the results unless the user requested a remix
		if (!query.toLowerCase().includes("remix"))
			searchRes[response].files = searchRes[response].files.filter((file) => {
				return !file.filename.toLowerCase().includes("remix");
			});
		if (!query.toLowerCase().includes("edit"))
			searchRes[response].files = searchRes[response].files.filter((file) => {
				return !file.filename.toLowerCase().includes("edit");
			});
		// TODO / EXPERIMENTAL: Filter out live-tagged titles if the song title does not have "live" in the name. Could cause issues/false filters.
		if (!query.toLowerCase().includes("live"))
			searchRes[response].files = searchRes[response].files.filter((file) => {
				// We are explicitly returning the filename rather than the path -- many live albums do not have "live" in the name, but the user may have sorted them as such.
				return !file.filename
					.split("\\")
					[file.filename.split("\\").length - 1].toLowerCase()
					.includes("live");
			});
		// If the filename itself (not including the path) doesn't include the song title, we don't want it.
		searchRes[response].files = searchRes[response].files.filter((file) => {
			return file.filename
				.split("\\")
				[file.filename.split("\\").length - 1].toLowerCase()
				.replace(/[^0-9a-z]/gi, "") // TODO: This works for them, but we need some way to differentiate non-alphanumeric titles.
				.includes(cleanQuerySongTitle);
		});
		// Filter by allowed filetypes
		searchRes[response].files = searchRes[response].files.filter((file) => {
			return slskd.allowFiletypes.some((filetype) => {
				return file.filename.endsWith(filetype);
			});
		});
	}

	// Filter empty responses again (TODO: maybe sometimes we can access locked files?)
	searchRes = searchRes.filter((response) => {
		return response.files.length > 0;
	});

	if (searchRes.length == 0)
		return new Response("No search results after filtered :-(", {
			status: 404,
		});

	// Sort by upload speed -- we will want more options later, like preferring flac, etc
	searchRes.sort((a, b) => b.uploadSpeed - a.uploadSpeed);

	// Sort by queue length -- this doesn't screw up ordering if they're equal, right?
	searchRes.sort((a, b) => a.queueLength - b.queueLength);

	// console.log(searchRes);
	console.log(`${searchRes.length} responses after filtering :-)`);

	// For now let's assume the first one will do
	return searchRes[0];
}

// Search soulseek with ARTIST - TITLE to download the file and then send it to the client.

import * as fs from "fs";
import { slskd } from "../../../.env.js";
import { Readable } from "stream";

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
	let searchStarted = Date.now();
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
		console.log(
			`Awaiting search completion for ${id} (${data.responseCount} responses). . .`
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
	console.log("== Search Completed ==");

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
	console.log(data);

	return data;
};

const CreateDownload = async (username, filePath, size) => {
	const response = await fetch(
		`${slskd.url}/api/v0/transfers/downloads/${username}`,
		{
			method: "POST",
			// TODO: it looks like we can request multiple downloads at once. We should probably try the first few results to avoid failure.
			body: JSON.stringify([
				{
					filename: filePath,
					size: size,
				},
			]),
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-API-Key": slskd.apikey,
			},
		}
	);

	// TODO: Handle server/connection error (here or in the composite logic?)
	return response;
};

const AwaitDownloadCompletion = async (username, filePath) => {
	// First we need to get the ID of the download that we want (the download creation api does not return this value)
	// So we will fetch all active downloads under the peer's username
	const response = await fetch(
		`${slskd.url}/api/v0/transfers/downloads/${username}`,
		{
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-API-Key": slskd.apikey,
			},
		}
	);
	const data = await response.json();

	// Find the file we want in the list of username's downloads
	// Find correct directory
	data.directories = data.directories.filter((dir) => {
		return filePath.includes(dir.directory);
	});

	// Find correct file in directory
	const file = data.directories[0].files.filter((file) => {
		return file.filename == filePath;
	});
	const fileId = file[0].id;
	console.log(fileId);

	// Repeatedly check to see if the file is at 100% yet
	while (true) {
		const response = await fetch(
			`${slskd.url}/api/v0/transfers/downloads/${username}/${fileId}`,
			{
				method: "GET",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"X-API-Key": slskd.apikey,
				},
			}
		);
		const data = await response.json();

		// TODO: If the ETA is extremely long (i.e. queue, or just download speed), maybe we can concurrently try another download
		// based on configs.
		console.log(
			`Downloading ${username}/${filePath} (${Math.round(data.percentComplete * 100) / 100}%) . . .`
		);
		// TODO: Progress report on client side? Maybe/maybe not.
		if (data.percentComplete >= 100) {
			break;
		}
		// repeat until finished
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	console.log("== Download Completed ==");

	return {
		username: username,
		id: fileId,
		filepath: filePath,
		isComplete: true,
	};
};

export default async function (query) {
	/*
	const url = new URL(request.url);

	const searchParams = new URLSearchParams(url.search);

	// TODO (longterm): We should not trust the client with this information.
	// Maybe only take MBID and then query it server-side to get the %ARTIST - %TITLE plus validate the mbid?
	const query = decodeURIComponent(searchParams.get("query"));
	const mbid = decodeURIComponent(searchParams.get("mbid"));
	*/
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

	console.log(searchRes);

	// Move this out of the loop to avoid unnecessary computation
	let cleanQuerySongTitle = query
		.split(" - ")[1]
		.toLowerCase()
		.replace(/[^0-9a-z]/gi, ""); // todo: edge cases?

	// Filter files per result
	for (let response in searchRes) {
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

	console.log(searchRes);
	console.log(`${searchRes.length} responses after filtering :-)`);

	let downloadResult;
	let chosenRes = null;
	let chosenFile = null;
	// Usually, this for loop only runs the first iteration, but
	for (let result in searchRes) {
		// Possibly use an array of these options to do multiple downloads in one request ?
		chosenRes = searchRes[result];
		chosenFile = searchRes[result].files[0];

		await CreateDownload(
			chosenRes.username,
			chosenFile.filename,
			chosenFile.size
		);

		downloadResult = await AwaitDownloadCompletion(
			chosenRes.username,
			chosenFile.filename
		);

		if (downloadResult.isComplete) {
			break;
		}
	}

	if (!downloadResult.isComplete) {
		return new Response(":-(", { status: 404 }); // is a better status code more descriptive?
	}

	console.log(chosenRes);

	const filename_arr = chosenFile.filename.split("\\");
	// slskd will auto-save the file in this directory format. TODO -- check for edge cases?
	const filePath = filename_arr
		.slice(Math.max(filename_arr.length - 2, 0))
		.join("/");

	console.log(filePath);

	// TODO: Create a cache db associating mbid to filepath
	const readStream = fs.createReadStream(`${slskd.path}${filePath}`);
	const webStream = Readable.toWeb(readStream) as ReadableStream<Uint8Array>;

	return new Response(webStream, {
		status: 200,
		headers: {
			"Content-Type": "audio/mpeg",
		},
	});
}

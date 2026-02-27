// Download a file from soulseek and then send it to the client.

import fs from "node:fs";
import { slskd } from "../config";

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

	const startTime = Date.now();

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

		process.stdout.write(
			`\rDownloading ${username}/${filePath} (${Math.round(data.percentComplete * 100) / 100}%) . . .`
		);

		// TODO: Configurable
		if (data.percentComplete == 0 && Date.now() - startTime > 10000) {
			console.log(`Download for ${username}/${filePath} timed out.`);

			return { isComplete: false };
		}

		// TODO: Progress report on client side? Maybe/maybe not.
		if (data.percentComplete >= 100) {
			break;
		}
		// repeat until finished
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
	console.log("\n== Download Completed ==");

	return {
		username: username,
		id: fileId,
		filepath: filePath,
		isComplete: true,
	};
};

export const Name = "slsk";
export const friendlyName = "Soulseek";
export const tries = slskd.tries ? slskd.tries : 3;

export async function Search(artist, title) {
	let search;
	const query = `${artist} - ${title}`;
	try {
		search = await CreateSearch(query);
		await AwaitSearchCompletion(search.id);
	} catch (err) {
		return new Response(`Search error: ${err}`, { status: 500 });
	}
	// TODO: find a better way to avoid this race condition.
	await new Promise((resolve) => setTimeout(resolve, 500));
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

	return searchRes;
}

export async function Download(searchResult: {
	username: string;
	files: any[];
}) {
	let downloadResult;

	console.log(searchResult);

	if (!searchResult.files)
		throw new Response("No songs found.", { status: 404 });
	const chosenFile: { filename: string; size: number } = searchResult.files[0];

	// slskd will auto-save the file in this directory format. TODO -- check for edge cases?
	const filename_arr = chosenFile.filename.split("\\");
	const filePath = filename_arr
		.slice(Math.max(filename_arr.length - 2, 0))
		.join("/");

	// Don't dowload if we already have it
	if (!fs.existsSync(`${slskd.path}${filePath}`)) {
		await CreateDownload(
			searchResult.username,
			chosenFile.filename,
			chosenFile.size
		);

		downloadResult = await AwaitDownloadCompletion(
			searchResult.username,
			chosenFile.filename
		);
	}

	if (!downloadResult.isComplete)
		throw new Response(
			`Could not download ${searchResult.username}/${chosenFile.filename}`,
			{
				status: 404,
			}
		);

	return `${slskd.path}${filePath}`;
}

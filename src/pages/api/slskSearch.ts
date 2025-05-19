// Search soulseek with ARTIST - TITLE to download the file and return a filepath for the client to then
// TODO: beyond demo, this should not be exposed as an API; rather, internally, the server should be parsing all of this within one `search` query.

import * as fs from "fs";
import { slskd } from "../../../.env.js";
import { Readable } from "stream";

// Create a search in slskd
const CreateSearch = async (query) => {
	let data;
	await fetch(`${slskd.url}/api/v0/searches`, {
		method: "POST",
		body: JSON.stringify({
			searchText: query,
		}),
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"X-API-Key": slskd.apikey,
		},
	})
		.then((res) => {
			return res.json();
		})
		.then((res) => {
			data = res;
			console.log(res);
		});

	return {
		query: data.searchText,
		id: data.id,
	};
};

// Check that search status
const AwaitSearchCompletion = async (id) => {
	let isComplete = false;
	while (!isComplete) {
		console.log("Awaiting search completion . . .");
		await fetch(`${slskd.url}/api/v0/searches/${id}`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-API-Key": slskd.apikey,
			},
		})
			.then((res) => {
				return res.json();
			})
			.then((res) => {
				console.log(res);
				if (res.isComplete) {
					isComplete = true;

					return res;
				}
			});
		if (isComplete) {
			console.log("== Search Completed ==");
			await SearchResponses(id);

			return {
				id: id,
				isComplete: true,
			};
		}

		// repeat until finished
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
};

// Retrieve search responses
const SearchResponses = async (id) => {
	let data;
	await fetch(`${slskd.url}/api/v0/searches/${id}/responses`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"X-API-Key": slskd.apikey,
		},
	})
		.then((res) => {
			return res.json();
		})
		.then((res) => {
			console.log(res);
			data = res;

			return res;
		});

	return data;
};

const CreateDownload = async (username, filePath, size) => {
	let data;
	await fetch(`${slskd.url}/api/v0/transfers/downloads/${username}`, {
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
	}).then((res) => {
		data = res;
		return res;
	});

	return data;
};

const AwaitDownloadCompletion = async (username, filePath) => {
	// First we need to get the ID of the download that we want (the download creation api does not return this value)
	let fileId;
	await fetch(`${slskd.url}/api/v0/transfers/downloads/${username}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"X-API-Key": slskd.apikey,
		},
	})
		.then((res) => {
			console.log(res);
			return res.json();
		})
		.then((res) => {
			let file = res.directories[0].files.filter((file) => {
				return file.filename == filePath;
			});
			console.log("========");
			console.log(file);
			fileId = file[0].id;
			console.log(fileId);
		});
	// Repeatedly check to see if the file is at 100% yet
	let isComplete = false;
	while (!isComplete) {
		console.log("Awaiting download completion . . .");
		await fetch(
			`${slskd.url}/api/v0/transfers/downloads/${username}/${fileId}`,
			{
				method: "GET",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"X-API-Key": slskd.apikey,
				},
			}
		)
			.then((res) => {
				console.log(res);
				return res.json();
			})
			.then((res) => {
				console.log(res);
				if (res.percentComplete >= 100) {
					isComplete = true;
					return res;
				}
			});
		if (isComplete) {
			console.log("== Download Completed ==");
			return {
				username: username,
				id: fileId,
				filepath: filePath,
				isComplete: true,
			};
		}

		// repeat until finished
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
};

export async function GET({ params, request }) {
	const url = new URL(request.url);

	const searchParams = new URLSearchParams(url.search);

	// TODO (longterm): We should not trust the client with this information.
	// Maybe only take MBID and then query it server-side to get the %ARTIST - %TITLE plus validate the mbid?
	const query = decodeURIComponent(searchParams.get("query"));
	const mbid = decodeURIComponent(searchParams.get("mbid"));

	const search = await CreateSearch(query);

	await AwaitSearchCompletion(search.id);
	let searchRes = await SearchResponses(search.id);
	// Sort by upload speed -- we will want more options later, like preferring flac, etc
	searchRes.sort((a, b) => b.uploadSpeed - a.uploadSpeed);
	// Some responses are for locked-only files (TODO: add a check for if we have access to locked files maybe? idk how they work)
	searchRes = searchRes.filter(response => {return response.files.length > 0});

	let chosenSearchRes = searchRes[0];
	let chosenFile = chosenSearchRes.files[0];

	console.log(searchRes[0]);
	// Possibly use an array of these options to do multiple downloads in one request ?
	let download = await CreateDownload(
		chosenSearchRes.username,
		chosenFile.filename,
		chosenFile.size
	);

	// TODO: we can stream the incomplete file.
	await AwaitDownloadCompletion(chosenSearchRes.username, chosenFile.filename);

	let filename_arr = chosenFile.filename.split("\\");
	// slskd will auto-save the file in this directory format. TODO -- check for edge cases?
	let filePath = filename_arr
		.slice(Math.max(filename_arr.length - 2, 0))
		.join("/");

	console.log(filePath);

	// TODO: Create a cache db associating mbid to filepath
	const readStream = fs.createReadStream(`./tests/slsk-downloads/${filePath}`);
	const webStream = Readable.toWeb(readStream) as ReadableStream<Uint8Array>;
	return new Response(webStream, {
		status: 200,
		headers: {
			"Content-Type": "audio/mpeg",
		},
	});
}

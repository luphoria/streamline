// Search soulseek with ARTIST - TITLE to download the file and [TODO] send it to the client.
// TODO: beyond demo, this should not be exposed as an API; rather, internally, the server should be parsing all of this within one `search` query.

import "fs";
import { slskd } from "../../../.env.js";

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

	console.log(data);

	return data;
};

export async function GET({ params, request }) {
	const url = new URL(request.url);

	const searchParams = new URLSearchParams(url.search);

	const query = decodeURIComponent(searchParams.get("query"));

	const search = await CreateSearch(query);

	await AwaitSearchCompletion(search.id);
	const searchRes = await SearchResponses(search.id);
	// Sort by upload speed -- we will want more options later, like preferring flac, etc
	searchRes.sort((a, b) => b.uploadSpeed - a.uploadSpeed);
	console.log(searchRes[0]);
	// Possibly use an array of these options to do multiple downloads in one request ?
	await CreateDownload(
		searchRes[0].username,
		searchRes[0].files[0].filename,
		searchRes[0].files[0].size
	);

	return new Response(
		JSON.stringify({
			res: "Download started",
		})
	);
}

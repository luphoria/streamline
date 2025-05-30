// Download a file from soulseek and then send it to the client.

import * as fs from "fs";
import { slskd } from "../.env.js";
import search from "./slsk_search";
import { AddRecording } from "../server/db/db.ts";

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
		process.stdout.write(
			`\rDownloading ${username}/${filePath} (${Math.round(data.percentComplete * 100) / 100}%) . . .`
		);
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

export default async function DownloadBySearch (query, mbid) {
	// Downloader
	let downloadResult;
	const chosenRes: { username: string; files: any[] } = await search(query);
	if (!chosenRes.files) throw new Response("No songs found.", { status: 404 });
	const chosenFile: { filename: string; size: number } = chosenRes.files[0];

	// slskd will auto-save the file in this directory format. TODO -- check for edge cases?
	const filename_arr = chosenFile.filename.split("\\");
	const filePath = filename_arr
		.slice(Math.max(filename_arr.length - 2, 0))
		.join("/");

	// Don't dowload if we already have it
	if (!fs.existsSync(`${slskd.path}${filePath}`)) {
		await CreateDownload(
			chosenRes.username,
			chosenFile.filename,
			chosenFile.size
		);

		downloadResult = await AwaitDownloadCompletion(
			chosenRes.username,
			chosenFile.filename
		);

		if (!downloadResult.isComplete) {
			throw new Response("Could not download", { status: 404 });
		}

	}

	try {
		AddRecording(mbid, `${slskd.path}${filePath}`, "slsk")
		const readStream = fs.createReadStream(`${slskd.path}${filePath}`);

		return readStream;
	} catch (e) {
		console.log(e);
	}
}

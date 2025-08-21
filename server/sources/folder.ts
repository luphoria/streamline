import fs from "node:fs";
import path from "node:path";
import { folder } from "../config";

export const Name = "folder";
export const friendlyName = "Music folder";
export const tries = folder.tries ? folder.tries : 1;

let folderItems = {};

const recursiveFolderSync = (folder) => {
	console.log(`[folder] Synchronizing folder ${folder} . . .`);
	const files = fs.readdirSync(folder);
	for (const file in files) {
		const filename = path.join(folder, files[file]);
		const fstat = fs.lstatSync(filename);
		if (fstat.isDirectory()) recursiveFolderSync(filename);
		else
			folderItems[filename.replaceAll(/[()[\]!?’'"]/g, "").toLowerCase()] =
				filename;
	}

	console.log(
		`[folder] Synchronized (${Object.keys(folderItems).length} items)`
	);

	return folderItems;
};

recursiveFolderSync(folder.path);
setInterval(() => recursiveFolderSync(folder.path), 60000 * 5);

export async function Search(queryArtist, queryTitle, albumTitle?, length?) {
	let results: { cleanName: string; filename: string; score: number }[] = [];
	for (const item in folderItems) {
		results.push({
			cleanName: item,
			filename: folderItems[item],
			score: 0,
		});
	}

	const queryArtistClean = queryArtist
		.replaceAll(/[()[\]!?’'"]/g, "")
		.toLowerCase();
	const queryTitleClean = queryTitle
		.replaceAll(/[()[\]!?’'"]/g, "")
		.toLowerCase();
	const albumTitleClean = albumTitle
		? albumTitle.replaceAll(/[()[\]!?’'"]/g, "").toLowerCase()
		: "";

	results = results.filter((result) => {
		return (
			result.cleanName.includes(queryArtistClean) &&
			result.cleanName.includes(queryTitleClean)
		);
	});

	console.log(
		`${results.length} items after filtering for query ${queryArtist} and ${queryTitle}`
	);

	for (let result in results) {
		//TODO: seconds length

		// Search for JUST the artist - title (in cases where the filename is XX. artist - title.flac )
		const resultSplit = results[result].cleanName.split(".");
		for (let item in resultSplit) {
			resultSplit[item] = resultSplit[item].replaceAll(" ", "");
			if (resultSplit[item] == `${queryArtistClean}-${queryTitleClean}`)
				results[result].score += 20;
		}

		if (results[result].cleanName.includes(albumTitleClean))
			results[result].score += 15; // Album title
		if (
			results[result].cleanName.includes(
				`${queryArtistClean} - ${queryTitleClean}`
			)
		)
			results[result].score += 15; // Album title

		if (results[result].filename.includes(queryTitle))
			results[result].score += 5; // Unsanitized title
		if (results[result].filename.includes(queryArtist))
			results[result].score += 5; // Unsanitized artist
	}

	console.log(results[0]);
	// Sort results
	results.sort((a, b) => {
		return b.score - a.score;
	});

	return results;
}

export async function Download(searchResult) {
	return searchResult.filename;
}

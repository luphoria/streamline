const prompt = require("prompt-sync")();
const fs = require("fs");
const path = require("path");

const PATH_TO_FOLDER = "C:\\Users\\user\\Music\\!RIPS\\";
let folderItems = {};

const recursiveFolderSync = (folder) => {
	let files = fs.readdirSync(folder);
	for (let file in files) {
		let filename = path.join(folder, files[file]);
		let fstat = fs.lstatSync(filename);
		if (fstat.isDirectory()) recursiveFolderSync(filename);
		else folderItems[filename.replaceAll(/[()[\].!?’'"]/g, "").toLowerCase()] = filename;
	}
	return folderItems
}

const loopFolderSync = async () => {
	console.log("Synchronizing folder . . .")
	folderItems = {};
	recursiveFolderSync(PATH_TO_FOLDER);
	setTimeout(loopFolderSync, 60000*5)
}

const folder = async (query) => {
	let results = []; 
	for (let item in folderItems) {
		results.push({
			cleanName: item,
			filename: folderItems[item],
			score: 0
		})
	};
	console.log(`${results.length} items`)

	query = query.split("|");
	let queryArtist = query[0].replaceAll(/[()[\].!?’'"]/g, "").toLowerCase();
	let queryTitle = query[1].replaceAll(/[()[\].!?’'"]/g, "").toLowerCase();

	results = results.filter(result => {
		return result.cleanName.includes(queryArtist) && result.cleanName.includes(queryTitle);
	});

	console.log(`${results.length} items after filtering for query`)

	console.log(results);

	for (let result in results) {
		//TODO: seconds length
		if (results[result].cleanName.includes(query[2])) results[result].score += 15; // Album title

		if(results[result].filename.includes(query[0])) results[result].score += 5; // Unsanitized title
		if(results[result].filename.includes(query[1])) results[result].score += 5; // Unsanitized artist
	}

	console.log(results);
	// Sort results
	results.sort((a, b) => {
		return b.score - a.score;
	});

	return results;
}


loopFolderSync();
let query = prompt("Enter query: ");

folder(query);
//The Beatles|Oh! Darling|Abbey Road|207

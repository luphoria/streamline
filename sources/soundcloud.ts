import { exec } from "child_process";
import quote from "shell-quote/quote";
import fs from "fs";
import { soundcloud } from "../.env";
import { AddRecording } from "../server/db/db";

const execPromise = (input) => {
	return new Promise((resolve, reject) => {
		exec(input, (error, stdout, stderr) => {
			if (error) {
				reject(`error: ${error.message}`);

				return;
			}

			if (stderr) {
				resolve(stderr);
			} else {
				resolve(stdout);
			}
		});
	});
};

export default async function soundcloudDownloadBySearch(
	artist,
	title,
	mbid,
	keywords?
) {
	console.log(`MBID ${mbid}`);
	// Search
	let results: { uploader: string; title: string; description: string; url: string; score: number }[] =
		[];
	try {
		if (!keywords) keywords = "";
		else keywords = keywords.replaceAll(/[()[\].!?/]/g, "");
		console.log(
			`Searching SoundCloud for "${artist} - "${title}" ${keywords}"...`
		);
		let resultsRaw =
				(await execPromise(
					`${soundcloud.ytdlpBinary} --default-search scsearch scsearch10:"${quote([`${artist} - ${title}`])} song" --no-playlist --no-check-certificate --flat-playlist --skip-download -f bestaudio --dump-single-json`
				) as string).split("\n");
		
		resultsRaw = JSON.parse(`[${resultsRaw.join(",")}]`.replace(",]","]"))[0]["entries"];
		console.log(resultsRaw);
		for (let result in resultsRaw) {
			console.log(resultsRaw[result]);
			results.push({
				uploader: resultsRaw[result]["uploader"],
				title: resultsRaw[result]["title"], // There is also "track?"
				description: resultsRaw[result]["description"],
				url: resultsRaw[result]["url"],
				score: 0 // Maybe also viewcount? 
			});
		}
	} catch (err) {
		console.error(err);
	}

	console.log(`${results.length} results before filtering`);

	// Filter results
	artist = artist.toLowerCase().replaceAll(/[()[\].!?/]/g, "");
	let songTitle = title.toLowerCase().replaceAll(/[()[\].!?/]/g, "");

	for (let res in results) {
		results[res].title = results[res].title
			.toLowerCase()
			.replaceAll(/[()[\].!?/]/g, "");
		
		results[res].uploader = results[res].uploader
			.toLowerCase()
			.replaceAll(/[()[\].!?/]/g, "");
	}

	// Put this in .env.js?
	const filters = [
		"remix",
		"edit",
		"live",
		"video",
		"cover",
		"slowed",
		"reverb",
		"nightcore",
		"clean",
		"bass", // bass-boost versions
		"take ", // different takes -- whitespace intensional
		"preview",
	];

	results = results.filter((res) => {
		return filters.every((term) => {
			return (
				(songTitle.includes(term) || !res.title.includes(term)) &&
				res.title.includes(songTitle)
			);
		});
	});

	if (results.length == 0) return { status: 404, msg: "sorry bro" };

	console.log(`${results.length} results after filtering`);

	// Score-based attribution per search result
	for (let res in results) {
		if (
			(results[res].title.includes("explicit") ||
				results[res].title.includes("dirty")) &&
			!songTitle.includes("clean")
		) {
			results[res].score += 5;
		}
		if (results[res].title.includes(keywords)) {
			results[res].score += 10;
		}
		if (results[res].uploader.includes(artist)) {
			results[res].score += 25;
		}
	}

	// Sort by score
	results.sort((a, b) => {
		return b.score - a.score;
	});

	console.log(results);

	console.log(results[0]);

	let filePath = (
		(await execPromise(
			`${soundcloud.ytdlpBinary} ${results[0].url} -P ${soundcloud.path} --no-warnings --restrict-filenames --print "after_move:filepath"`
		)) as string
	).split("\n")[0];

	console.log("===")
	console.log(filePath);

	// TODO: Create a cache db associating mbid to filepath
	AddRecording(mbid, filePath, "soundcloud");
	const readStream = fs.createReadStream(filePath);

	return readStream;
}

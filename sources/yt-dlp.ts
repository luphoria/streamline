import { exec } from "child_process";
import quote from "shell-quote/quote";
import fs from "fs";
import { ytdlp } from "../.env";
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

export default async function ytdlpDownloadBySearch(
	artist,
	title,
	mbid,
	keywords?
) {
	console.log(`MBID ${mbid}`);
	// Search
	let results: { channel: string; title: string; id: string; score: number }[] =
		[];
	try {
		if (!keywords) keywords = "";
		else keywords = keywords.replaceAll(/[()[\].!?/]/g, "");
		console.log(
			`Searching YouTube for "${artist} - "${title}" ${keywords}"...`
		);
		let resultsRaw = JSON.parse(
			(await execPromise(
				`${ytdlp.binary} --default-search ytsearch ytsearch10:'${quote([`${artist} - "${title}" ${keywords}`])} song' --no-playlist --no-check-certificate --flat-playlist --skip-download -f bestaudio --dump-single-json`
			)) as string
		).entries;
		for (let result in resultsRaw) {
			console.log(
				`${resultsRaw[result].channel} - ${resultsRaw[result].title} (${resultsRaw[result].id})`
			);
			results.push({
				channel: resultsRaw[result].channel,
				title: resultsRaw[result].title,
				id: resultsRaw[result].id,
				score: 0, // TODO: Favor the results that YT shows first.
			});
		}
	} catch (err) {
		console.error(err);
	}
	console.log(`${results.length} results before filtering`);

	// Filter results
	artist = artist.toLowerCase().replaceAll(/[()[\].!?/]/g, "");
	let songTitle = title.toLowerCase().replaceAll(/[()[\].!?/]/g, "");

	for (let res in results)
		results[res].title = results[res].title
			.toLowerCase()
			.replaceAll(/[()[\].!?/]/g, "");

	// Put this in .env.js?
	const filters = [
		"remix",
		"edit",
		"live",
		"video",
		"full album",
		"cover",
		"slowed",
		"reverb",
		"nightcore",
		"clean",
		"bass", // bass-boost versions
		"reacting",
		"reaction",
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
		if (results[res].title.includes("lyrics")) {
			results[res].score += 10;
		}
		if (results[res].title.includes("audio")) {
			results[res].score += 10;
		}
		if (results[res].title.includes(keywords)) {
			results[res].score += 10;
		}
		if (results[res].channel.endsWith(" - Topic")) {
			results[res].score += 10;
		}
		if (results[res].channel.includes(artist)) {
			results[res].score += 10;
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
			// We don't use -x because the file path doesn't properly print the new extension. Instead, let's just make sure it's the smallest/worst video file.
			`${ytdlp.binary} "${quote([results[0].id])}" -f wv+ba -P ${ytdlp.path} --no-warnings --restrict-filenames --print "after_move:filepath" --sponsorblock-remove all`
		)) as string
	).split("\n")[0];

	console.log(filePath);

	// TODO: Create a cache db associating mbid to filepath
	AddRecording(mbid, filePath, "yt-dlp");
	const readStream = fs.createReadStream(filePath);

	return readStream;
}

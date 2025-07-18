import { exec as nodeExec } from "node:child_process";
import fs from "node:fs";
import util from "node:util";

// import { t } from "try";
import quote from "shell-quote/quote";
import { ytdlp } from "../.env";
import { AddRecording } from "../server/db/db";
const exec = util.promisify(nodeExec);

export async function Search (artist, title, keywords?) {
	let results: { title: string; id: string; score: number }[] = [];
	if (!keywords) keywords = "";
	else keywords = keywords.replaceAll(/[()[\].!?/]/g, "");
	console.log(`Searching YouTube for "${artist} - ${title} ${keywords}"...`);
	const resultsRaw = await exec(
		`${ytdlp.binary} "https://music.youtube.com/search?q=${quote([`${artist} - ${title} ${keywords}`.replaceAll(" ", "+")])}" --no-playlist --no-check-certificate --flat-playlist --skip-download -f bestaudio --dump-single-json`
	);
	const resultsParsed = JSON.parse(resultsRaw.stdout).entries;
	for (const result in resultsParsed) {
		console.log(`${resultsParsed[result].title} (${resultsParsed[result].id})`);
		results.push({
			title: resultsParsed[result].title,
			id: resultsParsed[result].id,
			score: 0, // TODO: Favor the results that YT shows first.
		});
	}

	console.log(`${results.length} results before filtering`);

	// Filter results
	const songTitle = title.toLowerCase().replaceAll(/[()[\].!?/]/g, "").replaceAll(/&/g, "and");
	artist = artist.toLowerCase().replaceAll(/[()[\].!?/]/g, "");

	for (const res in results) {
		if (!results[res].title) {
			delete results[res];
			continue;
		}
		results[res].title = results[res].title
			.toLowerCase()
			.replaceAll(/[()[\].!?/]/g, "")
			.replaceAll(/&/g, "and");
	}

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

	if (results.length === 0)
		throw new Response("no results found", {
			status: 404,
		});

	console.log(`${results.length} results after filtering`);

	// Score-based attribution per search result
	for (const res in results) {
		if (
			(results[res].title.includes("explicit") ||
				results[res].title.includes("dirty")) &&
			!songTitle.includes("clean")
		) {
			results[res].score += 15;
		}
		if (results[res].title.includes("lyrics")) {
			results[res].score += 10;
		}
		if (results[res].title.includes("audio")) {
			results[res].score += 10;
		}
		if (results[res].title.includes(keywords.toLowerCase())) {
			results[res].score += 10;
		}
		if (results[res].title.includes(artist)) {
			results[res].score += 5;
		}
		// if (results[res].channel.endsWith(" - Topic")) {
		// 	results[res].score += 10;
		// }
		// if (results[res].channel.includes(artist)) {
		// 	results[res].score += 10;
		// }
	}

	// Sort by score
	results.sort((a, b) => {
		return b.score - a.score;
	});

	console.log(results);

	return results;
}

export async function Download (searchResult, mbid) {
	const filePath = (
		await exec(
			`${ytdlp.binary} "https://www.youtube.com/watch?v=${quote([searchResult.id])}" -f wv+ba -P ${ytdlp.path} --no-warnings --restrict-filenames --print "after_move:filepath" --sponsorblock-remove all`
		)
	).stdout.split("\n")[0];
	console.log(filePath);

	// TODO: Create a cache db associating mbid to filepath
	AddRecording(mbid, filePath, "yt-dlp");

	return filePath;
}
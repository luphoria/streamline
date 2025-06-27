import { exec as nodeExec } from "node:child_process";
import fs from "node:fs";
import util from "node:util";

import quote from "shell-quote/quote";
import { soundcloud } from "../.env";
import { AddRecording } from "../server/db/db";
const exec = util.promisify(nodeExec);

export default async function soundcloudDownloadBySearch(
	artist,
	title,
	mbid,
	keywords?
) {
	console.log(`MBID ${mbid}`);
	// Search
	let results: {
		uploader: string;
		title: string;
		description: string;
		url: string;
		score: number;
		duration: number;
	}[] = [];
	if (!keywords) keywords = "";
	else keywords = keywords.replaceAll(/[()[\].!?/]/g, "");
	console.log(`Searching SoundCloud for "${artist} - ${title} ${keywords}"...`);
	const resultsRaw = await exec(
		`${soundcloud.ytdlpBinary} --default-search scsearch scsearch10:${quote([`${artist} - ${title}`])} --no-playlist --no-check-certificate --flat-playlist --skip-download -f bestaudio --dump-single-json`
	);
	const resultsParsed = JSON.parse(
		`[${resultsRaw.stdout.split("\n").join(",")}]`.replace(",]", "]")
	)[0]["entries"];
	for (const result in resultsParsed) {
		console.log(resultsParsed[result]);
		results.push({
			uploader: resultsParsed[result]["uploader"],
			title: resultsParsed[result]["title"], // There is also "track?"
			description: resultsParsed[result]["description"],
			url: resultsParsed[result]["url"],
			score: 0, // Maybe also viewcount?
			duration: resultsParsed[result]["duration"],
		});
	}

	console.log(`${results.length} results before filtering`);

	// Filter results
	artist = artist.toLowerCase().replaceAll(/[()[\].!?/]/g, "");
	const songTitle = title.toLowerCase().replaceAll(/[()[\].!?/]/g, "");

	for (const res in results) {
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

	// TODO: Filter results with duration out of range from mb src duration.
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
	for (const res in results) {
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
		if (results[res].title.includes(`${artist} - ${songTitle}`)) {
			results[res].score += 25;
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

	// Most soundcloud results are garbage -- only pick
	if (results[0].score >= 25) {
		const filePath = (
			(
				await exec(
					`${soundcloud.ytdlpBinary} ${results[0].url} -P ${soundcloud.path} --no-warnings --restrict-filenames --print "after_move:filepath"`
				)
			).stdout as string
		).split("\n")[0];

		console.log("===");
		console.log(filePath);

		// TODO: Create a cache db associating mbid to filepath
		AddRecording(mbid, filePath, "soundcloud");

		return filePath;
	}

	throw new Response("No songs found.", { status: 404 });
}

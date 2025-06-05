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

export default async function ytdlpDownloadBySearch (query, mbid, keywords?) {
	console.log(`MBID ${mbid}`);
	// Search
	let results: { channel: string; title: string; id: string }[] = [];
	try {
		if (!keywords) keywords = "";
		else keywords = keywords.replaceAll(/[()[\].!?/]/g,"")
		console.log(`Searching YouTube for "${query} ${keywords}"...`)
		let resultsRaw = JSON.parse(
			(await execPromise(
				`${ytdlp.binary} --default-search ytsearch ytsearch10:"${quote([`${query} ${keywords}`])} song" --no-playlist --no-check-certificate --flat-playlist --skip-download -f bestaudio --dump-single-json`
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
			});
		}
	} catch (err) {
		console.error(err);
	}
	console.log(`${results.length} results before filtering`);
	// Filter results
	query = query.toLowerCase().replaceAll(/[()[\].!?/]/g,"");
	for (let res in results)
		results[res].title = results[res].title.toLowerCase().replaceAll(/[()[\].!?/]/g,"");

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
	];

	results = results.filter((res) => {
		return filters.every((term) => {
			return query.includes(term) || !res.title.includes(term);
		});
	});

	if (results.length == 0) return { status: 404, msg: "sorry bro" };

	console.log(`${results.length} results after filtering`);

	// TODO: More sorting (score-based system?)
	// Sort by channel name has "Topic"
	results.sort((a, b) => {
		return (
			+b.channel.toLowerCase().endsWith(" - Topic") -
			+a.channel.toLowerCase().endsWith(" - Topic")
		);
	});

	// Sort by artist matches channel
	results.sort((a, b) => {
		return (
			+b.channel.toLowerCase().includes(query.split(" - ")[0]) -
			+a.channel.toLowerCase().includes(query.split(" - ")[0])
		);
	});

	// YouTube has a lot of untagged clean versions of songs on the platform so this is an attempt at getting around some of that
	results.sort((a, b) => {
		return (
			+(
				(b.title.includes("explicit") || b.title.includes("dirty")) &&
				a.title.includes(query.split(" - ")[1]) &&
				!query.includes("clean")
			) -
			+(
				(a.title.includes("explicit") || a.title.includes("dirty")) &&
				b.title.includes(query.split(" - ")[1]) &&
				!query.includes("clean")
			)
		);
	});

	// Sort by containing "lyrics" in title (to avoid music video cuts) (if the title also includes the song title)
	results.sort((a, b) => {
		return (
			+(
				(b.title.includes("lyrics")) &&
				a.title.includes(query.split(" - ")[1])
			) -
			+(
				(a.title.includes("lyrics")) &&
				b.title.includes(query.split(" - ")[1])
			)
		);
	});

	//  Sort for "audio" in title (to avoid music video cuts) (if the title also includes the song title)
	results.sort((a, b) => {
		return (
			+(
				(b.title.includes("audio")) &&
				a.title.includes(query.split(" - ")[1])
			) -
			+(
				(a.title.includes("audio")) &&
				b.title.includes(query.split(" - ")[1])
			)
		);
	});

		//  Sort for keywords (release title) in title (to avoid music video cuts) (if the title also includes the song title)
		results.sort((a, b) => {
			return (
				+(
					(b.title.includes(keywords)) &&
					a.title.includes(query.split(" - ")[1])
				) -
				+(
					(a.title.includes(keywords)) &&
					b.title.includes(query.split(" - ")[1])
				)
			);
		});

	// Sort by contains correct title
	results.sort((a, b) => {
		return (
			+b.title.includes(query.split(" - ")[1].replaceAll(/[^a-z0-9 ]/g,"")) -
			+a.title.replaceAll(/[^a-z0-9 ]/g,"").includes(query.split(" - ")[1].replaceAll(/[^a-z0-9 ]/g,""))
		);
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
	AddRecording(mbid, filePath, "yt-dlp")
	const readStream = fs.createReadStream(filePath);

	return readStream;
};

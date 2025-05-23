import { exec } from "child_process";
import quote from "shell-quote/quote";
import fs from "fs";
import { ytdlp } from "../../.env";

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

export const YTDLPSearchAndDownload = async (query) => {
	// Search
	let results: { channel: string; title: string; id: string }[] = [];
	try {
		let resultsRaw = JSON.parse(
			(await execPromise(
				`${ytdlp.binary} --default-search ytsearch ytsearch10:"${quote([query])} song" --no-playlist --no-check-certificate --flat-playlist --skip-download -f bestaudio --dump-single-json`
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
	query = query.toLowerCase();
	for (let res in results)
		results[res].title = results[res].title.toLowerCase();

	if (!query.includes("remix"))
		results = results.filter((res) => {
			return !res.title.includes("remix");
		});
	if (!query.includes("edit"))
		results = results.filter((res) => {
			return !res.title.includes("edit");
		});
	if (!query.includes("live"))
		results = results.filter((res) => {
			return !res.title.includes("live");
		});
	if (!query.includes("video"))
		results = results.filter((res) => {
			return !res.title.includes("video");
		});
	if (!query.includes("full album"))
		// probably doesn't need to be in this if, but just in case
		results = results.filter((res) => {
			return !res.title.includes("full album");
		});
	if (!query.includes("cover"))
		results = results.filter((res) => {
			return !res.title.includes("cover");
		});

	if (results.length == 0) return { status: 404, msg: "sorry bro" };

	console.log(`${results.length} results after filtering`);

	// TODO: More sorting
	// Sort by containing "audio" or "lyrics" in title (to avoid music video cuts) (if the title also includes the song title)
	results.sort((a, b) => {
		return (
			+(
				(b.title.includes("audio") || b.title.includes("lyrics")) &&
				a.title.includes(query.split(" - ")[1])
			) -
			+(
				(a.title.includes("audio") || a.title.includes("lyrics")) &&
				b.title.includes(query.split(" - ")[1])
			)
		);
	});
	// Sort by contains correct title
	results.sort((a, b) => {
		return (
			+b.title.includes(query.split(" - ")[1]) -
			+a.title.includes(query.split(" - ")[1])
		);
	});

	console.log(results);

	console.log(results[0]);

	let filePath = (
		(await execPromise(
			// We don't use -x because the file path doesn't properly print the new extension. Instead, let's just make sure it's the smallest/worst video file.
			`${ytdlp.binary} "${quote([results[0].id])}" -f wv+ba -P ${ytdlp.path} --print "after_move:filename"`
		)) as string
	).split("\n")[0];

	console.log(filePath);

	// TODO: Create a cache db associating mbid to filepath
	const readStream = fs.createReadStream(filePath);

	return readStream;
};

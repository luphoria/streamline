const { exec } = require("child_process");
const prompt = require("prompt-sync")();
const quote = require("shell-quote/quote");

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

const SearchAndDownload = async (query) => {
	// Search
	let results = [];
	try {
		let resultsRaw = JSON.parse(
			await execPromise(
				// TODO: sanitize
				`yt-dlp --default-search ytsearch ytsearch10:"${quote([query])} song" --no-playlist --no-check-certificate --flat-playlist --skip-download -f bestaudio --dump-single-json`
			)
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
	console.log(results);
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

	// TODO: Sort results by things like if channel author is artist

	console.log(results[0]);

	let filePath = (
		await execPromise(
			// We don't use -x because the file path doesn't properly print the new extension. Instead, let's just make sure it's the smallest/worst video file.
			// TODO: sanitize
			`yt-dlp "${quote([results[0].id])}" -f wv+ba -P ./tests/yt-dlp --print "after_move:filename"`
		)
	).split("\n")[0];

	console.log(filePath);

	return filePath;
};
SearchAndDownload(prompt("Search: "));

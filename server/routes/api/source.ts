import type { Handler } from "express";
import slskSearch from "../../sources/slsk";
import { YTDLPSearchAndDownload } from "../../sources/yt-dlp";
import { t } from "try";
export const get: Handler = async (req, res, next) => {
	console.log(req.originalUrl);
	const url = new URL(req.url, "https://streamline.invalid");

	const searchParams = new URLSearchParams(url.search);

	const query = decodeURIComponent(searchParams.get("query"));
	const source = decodeURIComponent(searchParams.get("source"));
	let stream;
	switch (source) {
		case "slsk":
			stream = await t(slskSearch(query));
			break;
		case "yt-dlp":
			stream = await t(YTDLPSearchAndDownload(query));
			break;
		default:
			res.status(500).send("No source specified")
	}
	if (!stream.ok) {
		console.log(stream.error);

		return res
			.status((stream.error as Response).status)
			.send(await (stream.error as Response).text());
	}

	return stream.value.pipe(res);
};

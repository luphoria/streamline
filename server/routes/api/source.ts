import type { Handler } from "express";
import slskSearch from "../../sources/slsk";
import { YTDLPSearchAndDownload } from "../../sources/yt-dlp";
import { t } from "try";
import { GetRecording } from "../../db/db";
import * as fs from "fs";

export const get: Handler = async (req, res, next) => {
	console.log(req.originalUrl);
	const url = new URL(req.url, "https://streamline.invalid");

	const searchParams = new URLSearchParams(url.search);

	const query = decodeURIComponent(searchParams.get("query"));
	const mbid = decodeURIComponent(searchParams.get("mbid"));

	// Only accept requests with a valid MBID
	if (!mbid.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)) {
		return res
		.status(400)
		.send("Bad MBID");
	}
	// TODO: Get query from MBID instead of just getting both from client
	const source = decodeURIComponent(searchParams.get("source"));
	let stream;
	let usedSource;

	console.log("Checking DB for MBID . . .");
	const DBReq = GetRecording(mbid);
	console.log(DBReq);
	if (DBReq) {
		console.log(`File already in cache: ${DBReq.filepath}`);
		// TODO: download anyway if flag is fixed to try specific source that isn't cached or if some kind of force flag sent

		stream = await t(fs.createReadStream(DBReq.filepath));
		usedSource = "cache";
	} else {
		// Not already cached
		switch (source) {
			case "slsk":
				usedSource = "slsk";
				stream = await t(slskSearch(query, mbid));
				break;
			case "yt-dlp":
				usedSource = "yt-dlp";
				stream = await t(YTDLPSearchAndDownload(query, mbid));
				break;
		}
	}

	if (!stream.ok) {
		console.log(stream.error);

		console.log("Trying another source . . . ")
		// TODO: There's a better way to do this
		switch (usedSource) {
			case "cache":
				switch (source) {
					case "slsk":
						usedSource = "slsk";
						stream = await t(slskSearch(query, mbid));
						break;
					case "yt-dlp":
						usedSource = "yt-dlp";
						stream = await t(YTDLPSearchAndDownload(query, mbid));
						break;
					default:
						return res.status(500).send("No source specified");
				}
				break;
			case "slsk":
				usedSource = "yt-dlp";
				stream = await t(YTDLPSearchAndDownload(query, mbid));
				break;
			case "yt-dlp":
				usedSource = "yt-dlp";
				stream = await t(YTDLPSearchAndDownload(query, mbid));
				break;
			default: 
				return res.status(500).send("No source specified; song not in cache");
		}
	}

	if (!stream.ok) {
		return res
		.status((stream.error as Response).status)
		.send(await (stream.error as Response).text());
	}

	return stream.value.pipe(res);
};

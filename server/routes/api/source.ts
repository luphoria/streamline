import type { Handler } from "express";
import slskSearch from "../../sources/slsk";
import { t } from "try";
export const get: Handler = async (req, res, next) => {
	console.log(req.originalUrl);
	const url = new URL(req.url, "https://streamline.invalid");

	const searchParams = new URLSearchParams(url.search);

	const query = decodeURIComponent(searchParams.get("query"));
	//TODO: make this actually do something (when we have multiple sources ofc)
	const source = decodeURIComponent(searchParams.get("source")) || "slsk";
	const stream = await t(slskSearch(query));
	if (!stream.ok) {
		console.log(stream.error);

		return res.status((stream.error as Response).status).send(await (stream.error as Response).text());
	}

	return stream.value.pipe(res);
};

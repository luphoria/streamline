import { GetRecording, DeleteRecording } from "../../db/db";
import * as fs from "fs";

export const get: Handler = async (req, res, next) => {
    // TODO: Authentication settings for this option? 
	console.log(req.originalUrl);
	const url = new URL(req.url, "https://streamline.invalid");

	const searchParams = new URLSearchParams(url.search);

	const mbid = decodeURIComponent(searchParams.get("mbid"));

	// Only accept requests with a valid MBID
	if (!mbid.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g)) {
		return res
		.status(400)
		.send("Bad MBID");
	}

	console.log(`Checking DB to delete ${mbid} . . .`);
	const DBReq = GetRecording(mbid);
	console.log(DBReq);
	if (DBReq) {
		console.log(`File in cache: ${DBReq.filepath}\nDeleting ${mbid}. . .`);
		// TODO: download anyway if flag is fixed to try specific source that isn't cached or if some kind of force flag sent

		DeleteRecording(mbid);

        // TODO: Maybe make this optional? 
        console.log(`Deleting ${DBReq.filepath} . . .`);
        fs.unlink(DBReq.filepath, (err) => {
            return res.send(err);
        })

        return res.status(200).send(mbid);
	} 

    return res.status(404).send("Not Found");

};

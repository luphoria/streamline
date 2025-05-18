import msgpack from "msgpack-lite";

import { downloadAndConvert } from "./getChunks.js";

const chunkSizes = [500000, 0];

export async function handleConn(req, ws) {
	ws.binaryType = "arraybuffer";

	const searchParams = new URL(req.url, `http://${req.headers.host}`)
		.searchParams;
	const chunks = searchParams.get("chunks");
	const url = searchParams.get("url");

	if (!url) {
		ws.send(
			msgpack.encode(new Uint8Array({ error: "URL parameter is required" }))
		);
		ws.close();
		return;
	}

	const numChunks = parseInt(chunks);

	if (isNaN(numChunks) || numChunks <= 0 || numChunks > chunkSizes.length) {
		ws.send(msgpack.encode({ error: "Invalid chunks parameter" + numChunks }));
		ws.close();
		return;
	}

	console.info(`Downloading ${url} with ${numChunks} chunks`);

	try {
		const chunkSizesToUse = chunkSizes.slice(0, numChunks);

		await downloadAndConvert(
			url,
			chunkSizesToUse,
			(progress) => {
				try {
					console.info(`Progress: ${JSON.stringify(progress)}`);
					ws.send(msgpack.encode({ type: "progress", data: progress }));
				} catch (error) {
					console.error("Error sending progress:", error);
				}
			},
			(chunkIndex, buffer) => {
				try {
					console.info(`Sending chunk ${chunkIndex}`);
					ws.send(msgpack.encode({ type: "chunk", chunkIndex, data: buffer }));
				} catch (error) {
					console.error("Error sending chunk:", error);
				}
			}
		);

		try {
			ws.send(msgpack.encode({ type: "complete" }));
			ws.close();
		} catch (error) {
			console.error("Error sending complete message:", error);
		}
	} catch (error) {
		console.error("Error:", error);
		try {
			ws.send(msgpack.encode({ error: "An error occurred during conversion" }));
			// ws.close();
		} catch (wsError) {
			console.error("Error sending error message:", wsError);
		}
	}
}

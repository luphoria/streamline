import express from "express";
import createRouter from "express-file-routing";
import path from "node:path";
import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const app = express();

await createRouter(app, {
	directory: path.join(__dirname, "routes"),
});

app.listen(4322);

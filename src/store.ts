import { createStore } from "dreamland/core";
import { t } from "try";

export const store = createStore(
	// TODO: Pull store defaults from .env.js (but how?)
	{
		source: "qobuz",
		MB_URL: "https://musicbrainz.org/ws/2/",
	},
	{ ident: "settings", backing: "localstorage", autosave: "auto" }
);

(self as any).store = store;
export default store;

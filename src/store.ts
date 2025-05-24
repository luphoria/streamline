import { createStore } from "dreamland/core";

export const store = createStore(
	{
		source: "yt-dlp",
	},
	{ ident: "settings", backing: "localstorage", autosave: "auto" }
);

(self as any).store = store;
export default store;

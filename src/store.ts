import { createStore } from "dreamland/core";

export const store = createStore(
	{
		source: "ytdlp",
	},
	{ ident: "settings", backing: "localstorage", autosave: "auto" }
);

(self as any).store = store;
export default store;

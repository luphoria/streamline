import { createStore } from "dreamland/core";
const defaults = {
	API_URL: location.origin + "/api/",
	MB_URL: "https://musicbrainz.org",
	sources: [] as string[],
};

export const store = createStore(defaults, {
	ident: "settings",
	backing: "localstorage",
	autosave: "auto",
});

(self as any).store = store;
export default store;

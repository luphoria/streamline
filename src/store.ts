import { createStore } from "dreamland/core";
import { t } from "try";
let defaults = {
	API_URL: location.origin + "/api/",
	MB_URL: "https://musicbrainz.org/ws/2/",
	sources: [],
};
const response = await t(fetch("/api/settings/default"));
if (!response.ok || !response.value?.ok) {
	console.log("failed to grab defaults from server");
}

const data = await response.value.json();
if (data) {
	defaults = { ...defaults, ...data };
}

export const store = createStore(defaults, {
	ident: "settings",
	backing: "localstorage",
	autosave: "auto",
});

(self as any).store = store;
export default store;

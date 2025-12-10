import { createStore } from "dreamland/core";
import { t } from "try";
const response = await t(fetch("/api/settings/default"));
let defaults = {
	API_URL: location.origin + "/api/",
	MB_URL: "https://musicbrainz.org/ws/2/",
	source: "",
};
let serverDefaults = {};
if (!response.ok || !response.value?.ok) {
	console.log("failed to grab defaults from server");
	serverDefaults = {};
	
}
const data = await response.value?.json();
serverDefaults = data;

export const store = createStore(defaults, {
	ident: "settings",
	backing: "localstorage",
	autosave: "auto",
});

(self as any).store = store;
export default store;

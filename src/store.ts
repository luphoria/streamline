import { createStore } from "dreamland/core";
import { t } from "try";
const response = await t(fetch("/api/settings/default"));
let defaults: any;
if (!response.ok) {
	console.log("failed to grab defaults from server");
	defaults = {
		MB_URL: "https://musicbrainz.org/ws/2/",
		source: "",
	};
} else {
	const data = await response.value.json();
	defaults = data;
}
defaults["API_URL"] = location.origin + "/api/";
export const store = createStore(defaults, {
	ident: "settings",
	backing: "localstorage",
	autosave: "auto",
});

(self as any).store = store;
export default store;

import { MusicBrainz } from "./utils/MusicBrainz";
import Router from "./router";
import store from "./store";

import "xp.css/dist/XP.css";
import "./styles/main.css";
window.mb = new MusicBrainz(store.MB_URL);

const root = document.getElementById("app")!;
try {
	Router.mount(root)
} catch (e) {
	root.replaceWith(document.createTextNode("" + e));
	throw e;
}

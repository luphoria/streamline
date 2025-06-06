import type { Component } from "dreamland/core";
import { MusicBrainz } from "./utils/MusicBrainz";
import Router from "./router";
import store from "./store";

import "xp.css/dist/XP.css";
import "./styles/main.css";
window.mb = new MusicBrainz(store.MB_URL);

const App: Component = function (cx) {
	cx.css = `
		display: flex;
		flex-direction: row;
		gap: 1rem;

		justify-content: flex-start;
		align-items: center;
	`;
	cx.mount = () => {
		Router.mount(cx.root as HTMLElement);
	};
	return <div id="app" />;
};

const root = document.getElementById("app")!;
try {
	root.replaceWith(<App />);
} catch (e) {
	root.replaceWith(document.createTextNode("" + e));
	throw e;
}

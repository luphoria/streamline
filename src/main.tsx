import { MusicBrainz } from "./utils/MusicBrainz";
import { Route, router, Router } from "dreamland/router";
import { type Component } from "dreamland/core";
import store from "./store";

import Home from "./routes/home";
import Layout from "./layout/Layout";
import { ArtistView } from "./routes/artist";
import { ReleaseView } from "./routes/release";
import { Search } from "./routes/search";
import { Settings } from "./routes/settings";
import { Player } from "./routes/player";

import "xp.css/dist/XP.css";
import "./styles/main.css";
window.mb = new MusicBrainz(store.MB_URL);

const App: Component = function (cx) {
	cx.init = () => {
		router.route();
	};
	return (
		<div id="app">
			<Router>
				<Route show={<Layout />}>
					<Route show={<Home />} />
					<Route path="play/:mbid/:queue" show={<Player />} />
					<Route path="search/:query" show={<Search />} />
					<Route path="artist/:mbid" show={<ArtistView />} />
					<Route path="release/:mbid" show={<ReleaseView />} />
					<Route path="settings" show={<Settings />} />
				</Route>
			</Router>
		</div>
	);
};

const root = document.getElementById("app")!;
try {
	root.appendChild(<App />);
} catch (e) {
	root.replaceWith(document.createTextNode("" + e));
	throw e;
}

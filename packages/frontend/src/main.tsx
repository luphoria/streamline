import { css, type Component } from "dreamland/core";
import { Route, router, Router } from "dreamland/router";
import { CoverArtArchiveApi, MusicBrainzApi } from "musicbrainz-api";
import _store from "./store";

import Home from "./routes/home";
import Layout from "./layout/Layout";
import ArtistView from "./routes/artist";
import ReleaseView from "./routes/release";
import Search from "./routes/search";
import Settings from "./routes/settings";
import Player from "./routes/player";
import NotFound from "./routes/not-found";
import "xp.css/dist/XP.css";

window.mb = new MusicBrainzApi({
	appName: "streamline (https://github.com/luphoria/streamline)",
	appVersion: "0.0.1",
	appContactInfo: "contact@streamline.pn",
});
window.coverArt = new CoverArtArchiveApi();

const App: Component = function (cx) {
	cx.init = () => {
		router.route();
	};
	return (
		<div id="app">
			<Router>
				<Route show={<Layout />}>
					<Route show={<Home />} />
					<Route path="play/:mbid" show={<Player />} />
					<Route path="search/:query" show={<Search />} />
					<Route path="artist/:mbid" show={<ArtistView />} />
					<Route path="release/:mbid" show={<ReleaseView />} />
					<Route path="settings" show={<Settings />} />
					<Route path="*" show={<NotFound />} />
				</Route>
			</Router>
		</div>
	);
};
App.style = css`
	#app {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		justify-content: flex-start;
		align-items: center;
	}
`;
const root = document.getElementById("app")!;
try {
	root.appendChild(<App />);
} catch (e) {
	root.replaceWith(document.createTextNode("" + e));
	throw e;
}

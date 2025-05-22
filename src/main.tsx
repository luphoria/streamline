import { scope, Component, ComponentInstance } from "dreamland/core";
import { ArtistView } from "./components/artist";
import { Player } from "./components/player";
import { ReleaseView } from "./components/release";
import { Config } from "./components/config";

import { MusicBrainz } from "./utils/MusicBrainz";
import "./styles/main.css";
import { Search, SearchResults } from "./components/search";

const Main: Component<
	{},
	{
		mb: MusicBrainz;
	},
	{
		player: ComponentInstance<typeof Player>;
		artistView: ComponentInstance<typeof ArtistView>;
		releaseView: ComponentInstance<typeof ReleaseView>;
		searchResults: ComponentInstance<typeof SearchResults>;
		search: ComponentInstance<typeof Search>;
		config: ComponentInstance<typeof Config>;
	}
> = function (cx) {
	this.mb = new MusicBrainz("https://musicbrainz.org/ws/2/");
	this.player = <Player />;
	this.artistView = <ArtistView mb={use(this.mb)} />;
	this.releaseView = (
		<ReleaseView mb={use(this.mb)} artistView={use(this.artistView)} />
	);
	this.searchResults = <SearchResults results={[]} />;
	this.search = (
		<Search
			mb={use(this.mb)}
			sr={(r) =>
				(this.searchResults = (
					<SearchResults
						results={r}
						playSong={this.player.$.state.update}
						openRelease={this.releaseView.$.state.update}
					/>
				))
			}
		/>
	);
	this.config = <Config mb={use(this.mb)} />;
	return (
		<div id="app">
			{use(this.search)}
			<br />
			<h1>streamline</h1>
			<div id="fetchers">
				{use(this.player)}
				{use(this.releaseView)}
				{use(this.artistView)}
				{use(this.config)}
			</div>
			{use(this.searchResults)}
		</div>
	);
};

const root = document.getElementById("app")!;
try {
	root.replaceWith(<Main />);
} catch (e) {
	root.replaceWith(document.createTextNode("" + e));
	throw e;
}

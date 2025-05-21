import { scope, Component, ComponentInstance } from "dreamland/core";
import { ArtistView } from "./components/artist";
import { Player } from "./components/player";
import { ReleaseView } from "./components/release";
import { Config } from "./components/config";

import { MusicBrainz } from "./utils/MusicBrainz";
import "./main.css";
import { Search, SearchResults } from "./components/search";

const Main: Component<
	{},
	{
		mb: MusicBrainz;
	},
	{}
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
			sr={(r) => {
				this.searchResults = <SearchResults results={r} />;
			}}
		/>
	);
	this.config = <Config />;
	return (
		<div id="app">
			<div id="fetchers">
				<h1>Streamline</h1>
				{use(this.player)}
				{use(this.releaseView)}
				{use(this.artistView)}
				{use(this.config)}
			</div>
			{use(this.search)}
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

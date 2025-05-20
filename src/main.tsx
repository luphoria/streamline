import { scope, Component, ComponentInstance } from "dreamland/core";
import { ArtistView } from "./components/artist";
import { Player } from "./components/player";
import { ReleaseView } from "./components/release";

import { MusicBrainz } from "./utils/MusicBrainz";
import "./styles.css";

const Main: Component<
	{},
	{
		mb: MusicBrainz;
	},
	{

	}
> = function (cx) {
	this.mb = new MusicBrainz("https://musicbrainz.org/ws/2/");
	this.artistView = <ArtistView mb={use(this.mb)} />
	this.player = <Player />
	this.releaseView = <ReleaseView mb={use(this.mb)} artistView={use(this.artistView)} />
	return (
		<div id="app">
			{use(this.releaseView)}
			{use(this.artistView)}
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

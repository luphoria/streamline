import { scope, Component, ComponentInstance } from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";
const Artist: Component<{
	artist: Awaited<ReturnType<MusicBrainz["ArtistInfo"]>>;
}> = function (cx) {
	let resNumber = 0;
	return (
		<div class="musicbrainz-artist">
			<h3 id="artist-name">{this.artist.name}</h3>
			<h4 id="artist-disambiguation">{this.artist.disambiguation}</h4>
			<p>
				{use(this.artist.releaseGroups.all).mapEach((group) => {
					const number = resNumber;
					resNumber += 1;
					return (
						<span id={`release${number}`} mbid={group.mbid}>
							<b>{group.title}</b> ({group.date}) [{group.type}]
							<br />
						</span>
					);
				})}
			</p>
		</div>
	);
};

export const ArtistView: Component<
	{
		mb: MusicBrainz;
	},
	{
		update: (mbid: string) => Promise<void>;
		mbid: string;
		artist: Awaited<ReturnType<MusicBrainz["ArtistInfo"]>>;
	}
> = function (cx) {
	this.update = async (mbid: string) => {
		this.artist = await this.mb.ArtistInfo(mbid);
		this.artistEl = <Artist artist={use(this.artist)} />;
	};
	return (
		<div class="input-row">
			<input
				value={use(this.mbid).bind()}
				id="artistMbid"
				placeholder="e0c97a4d-c392-41a9-a374-57af3e3eeab3"
				type="text"
			/>
			<button id="artistButton" on:click={() => this.update(this.mbid)}>
				view artist
			</button>
			{use(this.artistEl)}
		</div>
	);
};

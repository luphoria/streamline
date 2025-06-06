import type { Component } from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";
import { Icon } from "../components/icon";
const Artist: Component<{
	artist: Awaited<ReturnType<MusicBrainz["ArtistInfo"]>>;
}> = function () {
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
	{},
	{},
	{
		artistEl: HTMLElement;
		mbid: string;
	}
> = function (cx) {
	const updateArtist = async (mbid: string) => {
		if (!mbid) return;
		this.artistEl = (
			<div class="loader">
				<Icon name="search_doc" />
			</div>
		);
		const artist = await window.mb.ArtistInfo(mbid);
		this.artistEl = <Artist artist={artist} />;
	};
	use(this.mbid).listen(updateArtist);

	cx.css = `
    :scope {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      justify-content: center;
      flex-direction: column;
      padding: 0.5rem;
    }

    .artist {
      width: 100%;
    }
  `;

	return (
		<div>
			<div>
				<input
					value={use(this.mbid).bind()}
					id="artistMbid"
					placeholder="e0c97a4d-c392-41a9-a374-57af3e3eeab3"
					type="text"
				/>
				<br />
				<button id="artistButton" on:click={() => updateArtist(this.mbid)}>
					view artist
				</button>
			</div>
			<div class="artist">{use(this.artistEl)}</div>
		</div>
	);
};

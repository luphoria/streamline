import { scope, Component, ComponentInstance } from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";

const Release: Component<
	{
		updateArtist: any;
		release: Awaited<ReturnType<MusicBrainz["ReleaseInfo"]>>;
		coverArt?: string;
	},
	{},
	{
		trackCount: number;
	}
> = function (cx) {
	this.trackCount = 0;
	return (
		<div>
			<img id="release-art" height="250" width="250" src={this.coverArt} />
			<h3 id="release-title">{this.release.title}</h3>
			<h4 id="release-artist">
				{use(this.release.artists).mapEach((artist) => {
					return (
						<a
							href="javascript:;"
							on:click={() => this.updateArtist(artist.mbid)}
						>
							{artist.name}
						</a>
					);
				})}
			</h4>
			<p id="release-tracklist">
				{use(this.release.trackList).mapEach((track) => {
					this.trackCount++;
					return (
						<span>
							{this.trackCount} <b>{track.title}</b>
							<br />
						</span>
					);
				})}
			</p>
		</div>
	);
};

export const ReleaseView: Component<
	{
		mb: MusicBrainz;
		artistView: any;
	},
	{
		update: (mbid: string) => Promise<void>;
		releaseEl: HTMLElement;
		mbid: string;
		release: Awaited<ReturnType<MusicBrainz["ReleaseInfo"]>>;
	}
> = function (cx) {
	this.update = async (mbid: string) => {
		this.mbid = mbid;
		this.releaseEl = <div>Loading...</div>;
		this.release = await this.mb.ReleaseInfo(mbid);
		const coverArtUrl = await this.mb.HdCoverArtUrl(mbid);
		this.releaseEl = (
			<Release
				release={use(this.release)}
				coverArt={coverArtUrl}
				updateArtist={this.artistView.$.state.update}
			/>
		);
	};
	return (
		<div class="musicbrainz-search input-row">
			<input id="releaseMbid" value={use(this.mbid).bind()} type="text" />
			<button id="releaseButton" on:click={() => this.update(this.mbid)}>
				view release
			</button>
			<br />
			{use(this.releaseEl)}
		</div>
	);
};

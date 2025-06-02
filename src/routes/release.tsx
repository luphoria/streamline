import type { Component, ComponentInstance } from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";
import { Link } from "../components/link";
import { error, t } from "try";

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
					return <Link href={`/artist/${artist.mbid}`}>{artist.name}</Link>;
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
	{},
	{
		update: (mbid: string) => Promise<void>;
		releaseEl: HTMLElement;
		downloadStatus: HTMLElement;
		mbid: string;
	}
> = function (cx) {
	const downloadRelease = async (mbid) => {
		this.downloadStatus = <div>loading...</div>
		const response = await t(fetch(`/api/sourceRelease?mbid=${mbid}&source=${store.source}`));
		if (!response.ok) {
			this.downloadStatus = <div>an error occured: {response.error}</div>;
			console.error(response.error);
			return;
		}
		this.downloadStatus = <div>{await response.value.text()}</div>;
	} 
	const updateReleases = async (mbid: string) => {
		this.releaseEl = <div>Loading...</div>;
		const release = await window.mb.ReleaseInfo(mbid);
		const coverArtUrl = await window.mb.HdCoverArtUrl(mbid);
		this.releaseEl = (
			<Release release={release} coverArt={coverArtUrl} />
		);
	};
	use(this.mbid).listen(updateReleases);
	return (
		<div class="musicbrainz-search input-row">
			<input id="releaseMbid" value={use(this.mbid).bind()} type="text" />
			<button id="releaseButton" on:click={() => updateReleases(this.mbid)}>
				view release
			</button>
			<br />
			<button on:click={() => downloadRelease(this.mbid)}>download release</button>
			<br />
			{use(this.releaseEl)}
			{use(this.downloadStatus)}
		</div>
	);
};

import type { Component } from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";
import { Link } from "../components/link";
import { t } from "try";
import { Icon } from "../components/icon";

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

	cx.css = `
	  :scope {
			display: flex;
		}

		.release-header {
		  display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.release-header * {
      margin: 0;
    }
	`

	return (
		<div>
  		<div class="release-header">
  			<img id="release-art" height="250" width="250" src={this.coverArt} />
  			<h3 id="release-title">{this.release.title}</h3>
  			<h4 id="release-artist">
  				{use(this.release.artists).mapEach((artist) => {
                    // @ts-expect-error
  					return <Link href={`/artist/${artist.mbid}`}>{artist.name}</Link>;
  				})}
  			</h4>
  		</div>
			<ul id="release-tracklist">
				{use(this.release.trackList).mapEach((track) => {
					this.trackCount++;
					return (
						<li>
						{/* @ts-expect-error */}
							<b>{track.title}</b>
						</li>
					);
				})}
			</ul>
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

  cx.css = `
    :scope {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      justify-content: center;
      flex-direction: column;
      padding: 0.5rem;
    }

    .release {
      width: 100%;
    }
  `

	const downloadRelease = async (mbid: string) => {
		this.downloadStatus = <div>loading...</div>
		// @ts-expect-error
		const response = await t(fetch(`/api/sourceRelease?mbid=${mbid}&source=${store.source}`));
		if (!response.ok) {
			this.downloadStatus = <div>an error occured: {response.error}</div>;
			console.error(response.error);
			return;
		}
		this.downloadStatus = <div>{await response.value.text()}</div>;
	}
	const updateReleases = async (mbid: string) => {
		this.releaseEl = <div class="loader"><Icon name="search_doc" /></div>;
		const release = await window.mb.ReleaseInfo(mbid);
		const coverArtUrl = await window.mb.HdCoverArtUrl(mbid);
		this.releaseEl = (
		    // @ts-expect-error
			<Release release={release} coverArt={coverArtUrl} />
		);
	};
	use(this.mbid).listen(updateReleases);
	return (
		<div class="musicbrainz-search">
		<div>
			<input id="releaseMbid" value={use(this.mbid).bind()} type="text" />
			<button id="releaseButton" on:click={() => updateReleases(this.mbid)}>
				view release
			</button>
			<button on:click={() => downloadRelease(this.mbid)}>download release</button>

			{use(this.downloadStatus)}
		</div>
		<div class="release">
			{use(this.releaseEl)}
		</div>
		</div>
	);
};

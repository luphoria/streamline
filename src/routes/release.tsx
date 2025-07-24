import { css, type Component } from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";
import { Link } from "dreamland/router";
import { t } from "try";
import Icon from "../components/icon";
import CoverArt from "../components/coverart";
import store from "../store";

const Release: Component<
	{
		release: Awaited<ReturnType<MusicBrainz["ReleaseInfo"]>>;
		coverArt?: string | undefined;
	}
> = function () {
	return (
		<div>
			<div class="release-header">
				<CoverArt src={this.coverArt ? this.coverArt : this.release.coverArt} size={250} />
				<h3 id="release-title">{this.release.title}</h3>
				<h4 id="release-artist">
					{use(this.release.artists).mapEach((artist) => {
						return <Link href={`/artist/${artist.mbid}`}>{artist.name}</Link>;
					})}
				</h4>
			</div>
			<ol id="release-tracklist">
				{use(this.release.trackList).mapEach((track) => (
					<li>
						<Link href={`/play/${track.mbid}`}>{track.title}</Link>
					</li>
				))}
			</ol>
		</div>
	);
};

Release.style = css`
	:scope {
		display: flex;
		gap: 1.5em;
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

    ol {
		padding: 0;
		margin-left: 1em;
		width: 100%;
    }

	li {
		width: 100%;
		padding: 0.5rem;
		border-bottom: 1px solid #999;
		font-size: .95rem;
	}
`;

export const ReleaseView: Component<
	{},
	{
		update: (mbid: string) => Promise<void>;
		releaseEl: HTMLElement;
		downloadStatus: HTMLElement;
		mbid: string;
	}
> = function () {
	const downloadRelease = async (mbid: string) => {
		this.downloadStatus = <div>loading...</div>;
		const response = await t(
			fetch(`/api/source/release?mbid=${mbid}&source=${store.source}`)
		);
		if (!response.ok) {
			this.downloadStatus = <div>an error occured: {response.error}</div>;
			console.error(response.error);
			return;
		}
		this.downloadStatus = <div>{await response.value.text()}</div>;
	};
	
	const updateReleases = async (mbid: string) => {
		this.releaseEl = (
			<div class="loader">
				<Icon name="search_doc" />
			</div>
		);
		const release = await window.mb.ReleaseInfo(mbid);
		const coverArtUrl = await window.mb.HdCoverArtUrl(mbid);
		this.releaseEl = (
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
				<button on:click={() => downloadRelease(this.mbid)}>
					download release
				</button>

				{use(this.downloadStatus)}
			</div>
			<div class="release">{use(this.releaseEl)}</div>
		</div>
	);
};

ReleaseView.style = css`
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
`;
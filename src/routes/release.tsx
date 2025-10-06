import { css, type Component } from "dreamland/core";
import { Link, router } from "dreamland/router";
import { t } from "try";
import Icon from "../components/icon";
import CoverArt from "../components/coverart";
import store from "../store";
import type { IRelease } from "musicbrainz-api";

const Release: Component<{
	release: IRelease;
	coverArt?: string | undefined;
}> = function () {
	return (
		<div>
			<div class="release-header">
				<CoverArt src={""} size={250} />
				<h3 id="release-title">{this.release.title}</h3>
				<h4 id="release-artist">
					{use(this.release["artist-credit"]).mapEach((artist) => {
						return (
							<Link href={`/artist/${artist.artist.id}`}>{artist.name}</Link>
						);
					})}
				</h4>
			</div>
			<ol id="release-tracklist">
				{use(this.release["media"][0]["tracks"]).mapEach((track) => (
					<li>
						<span>{track.title}</span>
						<button
							on:click={() => router.navigate(`/play/${track.id}?download`)}
						>
							Download
						</button>
						<button on:click={() => router.navigate(`/play/${track.id}?queue`)}>
							Add to Queue
						</button>
						<button on:click={() => router.navigate(`/play/${track.id}`)}>
							Play
						</button>
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
		font-size: 0.95rem;
	}

	button {
		float: right;
	}
`;

export const ReleaseView: Component<
	{},
	{
		releaseEl: HTMLElement;
		downloadStatus: HTMLElement;
		mbid: string;
	}
> = function () {
	const downloadRelease = async (mbid: string) => {
		this.downloadStatus = <div>loading...</div>;
		const response = await t(
			fetch(
				`${store.API_URL}source/release?mbid=${mbid}&source=${store.source}`
			)
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
		const release = await window.mb.lookup("release", mbid, [
			"recordings",
			"artist-credits",
		]);
		console.log(release);
		this.releaseEl = <Release release={release} />;
	};

	use(this.mbid).listen(updateReleases);
	return (
		<div class="musicbrainz-search">
			<div>
				<form
					on:submit={(e: SubmitEvent) => {
						e.preventDefault();
						updateReleases(this.mbid);
					}}
				>
					<input id="releaseMbid" value={use(this.mbid)} type="text" />
					<button id="releaseButton" type="submit">
						view release
					</button>
				</form>
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

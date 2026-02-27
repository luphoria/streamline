import { css, type Component } from "dreamland/core";
import { Link, router } from "dreamland/router";
import Icon from "../components/icon";
import CoverArt from "../components/coverart";
import type { IRelease } from "musicbrainz-api";

const Release: Component<
	{
		release: IRelease;
	},
	{},
	{}
> = function () {
	return (
		<div>
			<div class="release-header">
				<CoverArt
					src={`https://coverartarchive.org/release/${this.release.id}/front`}
					size={250}
				/>
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

const ReleaseView: Component<
	{},
	{
		mbid: string;
	},
	{
		release: IRelease | null;
	}
> = function () {
	const updateReleases = async (mbid: string) => {
		this.release = null;
		const release = await window.mb.lookup("release", mbid, [
			"recordings",
			"release-groups",
			"artists",
		]);
		this.release = release;
	};

	use(this.mbid).listen(updateReleases);
	return (
		<div class="release">
			{use(this.release).andThen(
				(release) => (
					<Release release={release} />
				),
				<div class="loader">
					<Icon name="search_doc" />
				</div>
			)}
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

export default ReleaseView;

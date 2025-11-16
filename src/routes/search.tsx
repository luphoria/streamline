import { css, type Component } from "dreamland/core";
import { router } from "dreamland/router";
import type { IArtistCredit, IRecording, IRecordingList } from "musicbrainz-api";
import Icon from "../components/icon";
import CoverArt from "../components/coverart";
import { Link } from "dreamland/router";

export const Recording: Component<
	{
		recording: IRecording;
	},
	{
		selectedRelease: string;
	}
> = function () {
	if (!this.recording.releases) return <div></div>;
	this.selectedRelease = this.recording.releases[0].id;

	return (
		<div>
			<span>
				<CoverArt
					src={use`https://archive.org/download/mbid-${this.selectedRelease}/__ia_thumb.jpg`}
					size={75}
				/>
				<span class="song-info">
					<div class="artist">
						{use(this.recording["artist-credit"] as IArtistCredit[]).mapEach((artist) => {
							return (
								<div>
									<Link href={`/artist/${artist.artist.id}`}>
										{artist.name}
									</Link>
									,
								</div>
							);
						})}
					</div>
					<div class="title">
						<b>{this.recording.title}</b> (
						{this.recording["first-release-date"]})
					</div>
				</span>
			</span>
			<span class="spacer"></span>
			<select value={use(this.selectedRelease)} name="versions">
				{use(this.recording.releases).mapEach((release) => {
					return (
						<option value={release.id}>
							{release.title} ({release.date}){" "}
							{release.country == "XW" || release.country == "XE"
								? "[global]"
								: `[${release.country}]`}{" "}
							{release.disambiguation ? `[${release.disambiguation}]` : ""}
						</option>
					);
				})}
				;
			</select>

			<span>
				<button on:click={() => router.navigate(`/play/${this.recording.id}`)}>
					Play
				</button>
				<button
					on:click={() => router.navigate(`/play/${this.recording.id}?queue`)}
				>
					Add to Queue
				</button>
				<button
					on:click={() =>
						router.navigate(`/play/${this.recording.id}?download`)
					}
				>
					Download
				</button>
				<button
					on:click={() => router.navigate(`/release/${this.selectedRelease}`)}
				>
					Open Release
				</button>
			</span>
		</div>
	);
};

Recording.style = css`
	:scope {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
	}

	.spacer {
		flex-grow: 1;
	}

	.song-info {
		font-size: 0.8rem;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.2em;
	}

	select {
		width: 30em;
	}

	span {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
	}
`;

export const Search: Component<
	{},
	{},
	{
		results: IRecordingList | null;
		query: string;
	}
> = function () {
	this.results = null;
	const updateSongs = async (query: string) => {
		if (!query) return;
		const results = await window.mb.search("recording", {
			query: decodeURIComponent(query),
			limit: 100,
			inc: ["releases"],
		});
		this.results = results;
	};
	use(this.query).listen(updateSongs);
	return (
		<div id="search-results">
			{use(this.results).andThen(
				() => <div>
					{use(this.results!.recordings).mapEach((recording) => (
						<Recording recording={recording} />
					))}
				</div>,
				<div class="loader">
					<Icon name="search_web" />
				</div>
			)}
		</div>
	);
};

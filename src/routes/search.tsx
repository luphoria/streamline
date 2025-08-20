import { css, type Component } from "dreamland/core";
import Router from "../router";
import type { RecordingGroup } from "../types/MusicBrainzType";
import Icon from "../components/icon";
import CoverArt from "../components/coverart";
import { Link } from "dreamland/router";

export const ResultItem: Component<
	{
		song: RecordingGroup;
	},
	{
		mbid: string;
		result: any;
	}
> = function () {
	this.result = this.song.versions[0];
	this.mbid = this.result.mbid;

	return (
		<div>
			<span>
				<CoverArt src={this.result.coverArt} size={75} />
				<span class="song-info">
					<div class="artist">
						{use(this.song.artists).mapEach((artist) => {
							return (
								<div>
									<Link href={`/artist/${artist.mbid}`}>{artist.name}</Link>,
								</div>
							);
						})}
					</div>
					<div class="title">
						<b>{this.song.title}</b> ({this.song.releaseDate})
					</div>
				</span>
			</span>
			<span class="spacer"></span>
			<select value={use(this.mbid)} name="versions">
				{this.song.versions.map((release) => {
					return (
						<option value={release.mbid}>
							{release.title} ({release.releaseDate}){" "}
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
				<button on:click={() => Router.navigate(`/play/${this.song.mbid}`)}>
					Play
				</button>
				<button
					on:click={() => Router.navigate(`/play/${this.song.mbid}/true`)}
				>
					Add to Queue
				</button>
				<button on:click={() => Router.navigate(`/release/${this.mbid}`)}>
					Open Release
				</button>
			</span>
		</div>
	);
};

ResultItem.style = css`
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

export const SearchResults: Component<{
	results: RecordingGroup[];
}> = function () {
	return (
		<div id="searchresults">
			{use(this.results).mapEach((song) => {
				return <ResultItem song={song} />;
			})}
		</div>
	);
};
export const Search: Component<
	{},
	{},
	{
		searchResults: HTMLElement;
		query: string;
	}
> = function () {
	const updateSongs = async (query: string) => {
		if (!query) return;
		this.searchResults = (
			<div class="loader">
				<Icon name="search_web" />
			</div>
		);
		const songs = (await window.mb.SearchSongs(
			decodeURIComponent(query)
		)) as RecordingGroup[];
		console.log(songs);
		this.searchResults = <SearchResults results={songs} />;
	};
	use(this.query).listen(updateSongs);
	return <div id="search-results">{use(this.searchResults)}</div>;
};

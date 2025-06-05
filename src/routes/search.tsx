import {
	createState,
	type Component,
	type ComponentInstance,
	type Stateful,
} from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";
import { Link } from "../components/link";
import router from "../router";
import type {
	RecordingGroup,
	Release,
	SongVersion,
} from "../stores/searchResults";
import { Icon } from "../components/icon";

export const ResultItem: Component<
	{
		song: RecordingGroup;
	},
	{
		selectedMbid: Stateful<{ value: string }>;
		firstResult: any;
	}
> = function (cx) {
	cx.css = `
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

	this.firstResult = this.song.versions[0];
	console.log(this.firstResult);
	this.selectedMbid = createState({
		value: this.firstResult.mbid,
	});

	return (
		<div>
			<span>
				<img
					height="75px"
					width="75px"
					src={this.firstResult.coverArt}
					on:error={(e: any) => {
						let el = e.target as HTMLImageElement;
						el.src = "/public/shell32/cd_unknown.gif";
						el.style = "image-rendering: pixelated; scale: 0.6;";
					}}
					alt="Cover Art"
				/>
				<span class="song-info">
					<div class="artist">{this.song.artist}</div>
					<div class="title"><b>{this.song.title}</b> ({this.song.releaseDate})</div>
				</span>
			</span>
			<span class="spacer"></span>
			<select bind:value={use(this.selectedMbid).bind()} name="versions">
				{this.song.versions.map((release) => {
					return (
						<option value={release.mbid}>
							{release.title} ({release.releaseDate}){" "}
							{release.country == "XW" ? "[global]" : `[${release.country}]`}{" "}
							{release.disambiguation ? `[${release.disambiguation}]` : ""}
						</option>
					);
				})}
				;
			</select>

			<span>
				<button on:click={() => router.navigate(`/play/${this.song.mbid}`)}>
					Play
				</button>
				<button
					on:click={() =>
						router.navigate(`/release/${this.selectedMbid.value}`)
					}
				>
					Open Release
				</button>
			</span>
		</div>
	);
};

export const SearchResults: Component<{
	results: RecordingGroup[];
}> = function (cx) {
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
> = function (cx) {
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

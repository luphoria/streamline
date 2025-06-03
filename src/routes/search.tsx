import {
	createState,
	type Component,
	type ComponentInstance,
} from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";
import { Link } from "../components/link";
import router from "../router";
import type { RecordingGroup } from "../stores/searchResults";

export const SearchResults: Component<{
	results: RecordingGroup[];
}> = function (cx) {
	return (
		<div id="searchresults">
			{use(this.results).mapEach((song) => {
				const firstResult = song.versions[0];
				const selectedMbid = createState({
					value: firstResult.mbid,
				});
				return (
					<div>
						<img height="75px" width="75px" src={firstResult.coverArt} />
						<span>{song.artist}</span> - <b>{song.title}</b> (
						{song.releaseDate})
						<select value={use(selectedMbid.value).bind()}>
							{song.versions.map((release) => {
								return (
									<option value={release.mbid}>
										{release.title} ({release.releaseDate}) {release.country == "XW" ? "[global]" : `[${release.country}]`} {release.disambiguation ? `[${release.disambiguation}]` : ""}
									</option>
								);
							})}
							;
						</select>
						<button
							on:click={() =>
								router.navigate(
									`/play/${encodeURIComponent(`${song.artist} - ${song.title}`)}/${song.mbid}`
								)
							}
						>
							Play
						</button>
						<button
							on:click={() => router.navigate(`/release/${selectedMbid.value}`)}
						>
							Open Release
						</button>
					</div>
				);
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
		this.searchResults = <div>Loading...</div>;
		const songs = await window.mb.SearchSongs(decodeURIComponent(query));
		console.log(songs);
		this.searchResults = <SearchResults results={songs} />;
	};
	use(this.query).listen(updateSongs);
	return <div id="search-results">{use(this.searchResults)}</div>;
};

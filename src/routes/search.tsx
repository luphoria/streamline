import {
	createState,
	type Component,
	type ComponentInstance,
} from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";
import { Link } from "../components/link";
import router from "../router";
import type { SongGroup } from "../stores/searchResults";

export const SearchResults: Component<{
	results: SongGroup[];
}> = function (cx) {
	return (
		<div id="searchresults">
			{use(this.results).mapEach((song) => {
				const firstResult = song.versions[0];
				console.log(firstResult);
				const selectedMbid = createState({
					value: firstResult.parentMbid,
				});
				return (
					<div>
						<img height="75px" width="75px" src={firstResult.coverArt} />
						<span>{firstResult.artist}</span> - <b>{firstResult.title}</b> (
						{firstResult.releaseDate})
						<select value={use(selectedMbid.value).bind()}>
							{song.versions.map((version) => {
								return (
									<option value={version.parentMbid}>
										{version.releaseTitle} ({version.releaseDate})
									</option>
								);
							})}
							;
						</select>
						<button
							on:click={() =>
								router.navigate(
									`/play/${encodeURIComponent(`${firstResult.artist} - ${firstResult.title}`)}/${firstResult.mbid}`
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

import {
	createState,
	scope,
	Component,
	ComponentInstance,
} from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";
import { Link } from "../components/link";

export const SearchResults: Component<{
	results: [];
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
						<Link href={`/play/${firstResult.artist} - ${firstResult.title}`}>
							Play
						</Link>
						<Link href={`/release/${selectedMbid.value}`}>
							Open Release
						</Link>
					</div>
				);
			})}
		</div>
	);
};
export const Search: Component<
	{},
	{
		updateSongs: (query: string) => Promise<void>;
	}
> = function (cx) {
	const updateSongs = async (query) => {
		if (!query) return;
		const songs = await window.mb.SearchSongs(query);
		console.log(songs)
		this.searchResults = <SearchResults results={songs}/>
	};
	use(this.query).listen(updateSongs)
	return (
		<div id="searchbar">
			<span>
				<input
					type="text"
					id="songSearchValue"
					placeholder="ARTIST - SONG or search..."
					value={use(this.songQuery).bind()}
				/>
				<button
					id="songSearchBtn"
					on:click={() => updateSongs()}
				>
					Search song
				</button>
			</span>
			<span>
				<input
					type="text"
					id="artistSearchValue"
					placeholder="ARTIST or search..."
				/>
				<button id="artistSearchBtn">Search artist</button>
			</span>
			{use(this.searchResults)}
		</div>
	);
};

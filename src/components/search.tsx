import { createState, scope, Component, ComponentInstance } from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";

export const SearchResults: Component<{
	playSong: (input: string) => Promise<void>,
	updateReleases: (mbid: string) => Promise<void>
	results: [];
}, {}, {
	selectedMbid: string;
}> = function (cx) {
	return (
		<div id="searchresults">
			{use(this.results).mapEach((song) => {
				const firstResult = song.versions[0];
				console.log(firstResult)
				const selectedMbid = createState({
					value: firstResult.parentMbid
				})
				return (
					<div>
						<img height="75px" width="75px" src={firstResult.coverArt} />
						<span>{firstResult.artist}</span> - <b>{firstResult.title}</b> ({firstResult.releaseDate})
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
								this.playSong(`${firstResult.artist} - ${firstResult.title}`)
							}
						>
							Play
						</button>
						<button on:click={() => this.openRelease(selectedMbid.value)}>Open Release</button>
					</div>
				);
			})}
		</div>
	);
};
export const Search: Component<
	{
		mb: MusicBrainz,
	},
	{
		updateSongs: (query: string) => Promise<void>;
	}
> = function (cx) {
	this.updateSongs = async (query) => {
		this.songQuery = query; 
		const songs = await this.mb.SearchSongs(query);
		console.log(this.sr);
		this.sr(songs);
	};
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
					on:click={() => this.updateSongs(this.songQuery)}
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
		</div>
	);
};

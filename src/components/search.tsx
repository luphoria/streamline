import { scope, Component, ComponentInstance } from "dreamland/core";

export const SearchResults = function (cx) {
	const firstResult = this.results[0];
	return (
		<div>
			{use(this.results).mapEach((song) => {
				const firstResult = song.versions[0];
				return (
					<div>
						<img height="75px" width="75px" src={firstResult.coverArt} />
						<span>{firstResult.artist}</span> - <b>{firstResult.title}</b> (
						{firstResult.releaseDate})
						<select>
							{song.versions.map((version) => {
								return (
									<option valued={version.parentMbid}>
										{version.releaseTitle} ({version.releaseDate})
									</option>
								);
							})}
							;
						</select>
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
	this.updateSongs = async (query: string) => {
		const songs = await this.mb.SearchSongs(query);
		this.resultsEl = <SearchResults results={songs} />;
	};
	return (
		<div>
			<input type="text" id="musicBrainzApiUrl" />
			<button id="apiUrlSetBtn">Set MusicBrainz API URL</button>
			<br />
			<br />
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
			<input
				type="text"
				id="artistSearchValue"
				placeholder="ARTIST or search..."
			/>
			<button id="artistSearchBtn">Search artist</button>
			<br />
			<br />
			{use(this.resultsEl)}
		</div>
	);
};

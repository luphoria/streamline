import { scope, Component, ComponentInstance } from "dreamland/core";
import { MusicBrainz } from "../utils/MusicBrainz";

export const Config: Component<
	{
		mb: MusicBrainz;
	},
	{},
	{
		apiUrl: string;
	}
> = function (cx) {
	this.apiUrl = "https://musicbrainz.org/ws/2/";
	return (
		<div class="input-row">
			<input
				type="text"
				id="musicBrainzApiUrl"
				value={use(this.apiUrl).bind()}
			/>
			<button id="apiUrlSetBtn" on:click={() => this.mb.SetApiUrl(this.apiUrl)}>
				Set MusicBrainz API URL
			</button>
		</div>
	);
};

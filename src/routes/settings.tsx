import type { Component, ComponentInstance } from "dreamland/core";
export const Settings: Component<{},{},
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
			<button id="apiUrlSetBtn" on:click={() => window.mb.SetApiUrl(this.apiUrl)}>
				Set MusicBrainz API URL
			</button>
		</div>
	);
};
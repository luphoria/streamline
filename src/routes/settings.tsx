import type { Component, ComponentInstance } from "dreamland/core";
import store from "../store";
export const Settings: Component<
	{},
	{},
	{
		apiUrl: string;
	}
> = function (cx) {
	// TODO: Populate options by .env
	cx.mount = () => {
		this.apiUrl = "https://musicbrainz.org/ws/2/";
	};
	return (
		<div class="input-row">
			<input
				type="text"
				id="musicBrainzApiUrl"
				value={use(this.apiUrl).bind()}
			/>
			<button
				id="apiUrlSetBtn"
				on:click={() => window.mb.SetApiUrl(this.apiUrl)}
			>
				Set MusicBrainz API URL
			</button>
			<div>pick a source</div>
			<select value={use(store.source).bind()}>
				<option value="ytdlp">yt-dlp</option>
				<option value="slsk">slsk</option>
			</select>	
		</div>
	);
};

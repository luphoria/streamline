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
		this.apiUrl = store.MB_URL;
	};

	cx.css = `
	  :scope {
			width: 100%;
		}

		.settings-row {
		  display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
		}

	 .h-group {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
    }
	`;

	return (
		<div>
		  <h2>Settings</h2>
			<div class="settings-row">
				<span class="title">MusicBrainz API URL</span>
				<div class="h-group">
					<input
						type="text"
						id="musicBrainzApiUrl"
						value={use(this.apiUrl).bind()}
					/>
					<button
						id="apiUrlSetBtn"
						on:click={() => {
							window.mb.SetApiUrl(this.apiUrl);
							store.MB_URL = this.apiUrl;
						}}
					>
						Set MusicBrainz API URL
					</button>
				</div>
			</div>
			<div class="settings-row">
				<span class="title">Download source</span>
				<select value={use(store.source).bind()}>
					<option value="ytdlp">YouTube</option>
					<option value="slsk">Soulseek</option>
				</select>
			</div>
		</div>
	);
};

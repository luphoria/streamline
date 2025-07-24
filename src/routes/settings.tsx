import { css, type Component } from "dreamland/core";
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

	const updateURL = async (url: string) => {
		console.log(url);
		window.mb?.SetApiUrl(url);
		store.MB_URL = url;
	};

	use(this.apiUrl).listen(updateURL);

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
				</div>
			</div>
			<div class="settings-row">
				<span class="title">Download source</span>
				<select value={use(store.source).bind()}>
					<option value="yt-dlp">YouTube</option>
					<option value="slsk">Soulseek</option>
					<option value="soundcloud">SoundCloud</option>
					<option value="qobuz">Qobuz</option>
				</select>
			</div>
		</div>
	);
};
Settings.style = css`
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

	input[type="text"] {
		min-width: 15em;
	}

	.h-group {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
    }	
`;

import { css, type Component } from "dreamland/core";
import store from "../store";
import { t } from "try";


export const Settings: Component<{}, {}, {
	sourcesDropdown: HTMLSelectElement;
	sources: any[]
}> = function (cx) {
	cx.mount = () => {
		fetchNewSources(store.API_URL);
	}
	this.sources = [];
	const setMBURL = (url: string) => window.mb.SetApiUrl(url)
	const fetchNewSources = async (url: string) => {
		const response = await t(fetch(`${url}source/list`))
		if (!response.ok) {
			this.sources = [];
			return;
		}
		if (!response.value.ok) {
			this.sources = [];
			return;
		}
		const data = await response.value.json();
		this.sources = data;
		this.sourcesDropdown.value = store.source;
	};
	use(store.MB_URL).listen(setMBURL);
	use(store.API_URL).listen(fetchNewSources);
	return (
		<div>
			<h2>Settings</h2>
			<div class="settings-row">
				<span class="title">Streamline API URL</span>
				<div class="h-group">
					<input
						type="text"
						id="musicBrainzApiUrl"
						value={use(store.API_URL)}
					/>
				</div>
			</div>
			<div class="settings-row">
				<span class="title">MusicBrainz API URL</span>
				<div class="h-group">
					<input
						type="text"
						id="musicBrainzApiUrl"
						value={use(store.MB_URL)}
					/>
				</div>
			</div>
			<div class="settings-row">
				<span class="title">Download source</span>
				<select value={use(store.source)} this={use(this.sourcesDropdown)}>
					{use(this.sources).mapEach((val) => <option value={val.Name}>{val.friendlyName}</option>)}
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

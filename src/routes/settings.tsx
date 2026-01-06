import { css, type Component } from "dreamland/core";
import store from "../store";
import { t } from "try";

const settingsCss = css`
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


const ServerSettings: Component<
	{},
	{},
	{
		sources: string[];
		sourceTable: HTMLTableSectionElement;
	}
> = function (cx) {
	this.sources = [];
	cx.mount = () => {
		fetchNewSources(store.API_URL);
	};
	const fetchNewSources = async (url: string) => {
		const response = await t(fetch(`${url}source/list`));
		if (!response.ok) {
			this.sources = [];
			return;
		}
		if (!response.value.ok) {
			this.sources = [];
			return;
		}
		const data = await response.value.json();
		if (store.sources && store.sources.length > 0) {
			const sourceMap = new Map(
				data.map((source: any) => [source.Name, source])
			);
			this.sources = store.sources
				.map((name: string) => sourceMap.get(name))
				.filter((source: any) => source !== undefined);

			// Add any new sources that aren't in the stored order
			const storedNames = new Set(store.sources);
			const newSources = data.filter(
				(source: any) => !storedNames.has(source.Name)
			);
			this.sources = [...this.sources, ...newSources];
		} else {
			store.sources = data;
			this.sources = data;
		}
	};
	return (
		<div>
			<h4>Server Specific Settings</h4>
			<div class="settings-row">
				<span class="title">Download source</span>
				<table>
					<tbody
						on:drop={(e) => {
							e.preventDefault();
							const draggedIndex = parseInt(e.dataTransfer.getData("text/plain"));
							const dropTarget = (e.target as HTMLElement).closest("tr");
							if (!dropTarget) return;

							const dropIndex = Array.from(this.sourceTable.rows).indexOf(
								dropTarget as HTMLTableRowElement
							);

							const newSources = [...this.sources];
							const [draggedItem] = newSources.splice(draggedIndex, 1);
							newSources.splice(dropIndex, 0, draggedItem);
							this.sources = newSources;

							store.sources = Array.from(
								this.sourceTable.rows,
								(row) => row.dataset.source
							);
							console.log(store.sources);
						}}
						this={use(this.sourceTable)}
					>
						{use(this.sources).mapEach((val, index) => (
							<tr
								data-source={val.Name}
								draggable="true"
								on:dragstart={(e) => {
									e.dataTransfer.effectAllowed = "move";
									e.dataTransfer.setData("text/plain", index.toString());
								}}
								on:dragover={(e) => {
									e.preventDefault();
									e.dataTransfer.dropEffect = "move";
								}}
							>
								<td>{val.friendlyName}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

ServerSettings.style = settingsCss
export const Settings: Component<{}, {}, {}> = function (cx) {
	const setMBURL = (url: string) =>  {
		window.mb.config.baseUrl = url;
		//@ts-expect-error calling something internally to take over
		window.mb.httpClient = window.mb.initHttpClient();
	}
	use(store.MB_URL).listen(setMBURL);
	return (
		<div>
			<h2>Settings</h2>
			<div class="settings-row">
				<span class="title">Streamline API URL</span>
				<div class="h-group">
					<input type="text" id="streamlineApiUrl" value={use(store.API_URL)} />
				</div>
			</div>
			<div class="settings-row">
				<span class="title">MusicBrainz API URL</span>
				<div class="h-group">
					<input type="text" id="musicBrainzApiUrl" value={use(store.MB_URL)} />
				</div>
			</div>
			<ServerSettings />
		</div>
	);
};
Settings.style = settingsCss

export default Settings;

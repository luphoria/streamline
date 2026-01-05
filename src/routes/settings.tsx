import { css, type Component } from "dreamland/core";
import store from "../store";
import { t } from "try";

export const Settings: Component<
	{},
	{},
	{
		sourcesDropdown: HTMLSelectElement;
		sources: any[];
		sourceTable: HTMLTableSectionElement
	}
> = function (cx) {
	cx.mount = () => {
    fetchNewSources(store.API_URL);
	};
	this.sources = [];
	const setMBURL = (url: string) => (window.mb.config.baseUrl = url);
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
		this.sources = data;
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
					<input type="text" id="musicBrainzApiUrl" value={use(store.MB_URL)} />
				</div>
			</div>
			<div class="settings-row">
				<span class="title">Download source</span>
				<table>
					<tbody
					on:drop={(e) => {
						e.preventDefault();
						const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
						const dropTarget = (e.target as HTMLElement).closest('tr');
						if (!dropTarget) return;
						
						const dropIndex = Array.from(this.sourceTable.rows).indexOf(dropTarget as HTMLTableRowElement);
						
						const newSources = [...this.sources];
						const [draggedItem] = newSources.splice(draggedIndex, 1);
						newSources.splice(dropIndex, 0, draggedItem);
						this.sources = newSources;
						
						store.sources = Array.from(this.sourceTable.rows, (row) => row.dataset.source);
						console.log(store.sources);
					}}
					this={use(this.sourceTable)}>
						{use(this.sources).mapEach((val, index) => (
							<tr
								data-source={val.Name} 
								draggable="true"
								on:dragstart={(e) => {
									e.dataTransfer.effectAllowed = 'move';
									e.dataTransfer.setData('text/plain', index.toString());
								}}
								on:dragover={(e) => {
									e.preventDefault();
									e.dataTransfer.dropEffect = 'move';
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

export default Settings;
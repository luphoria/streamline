import type { Component } from "dreamland/core";
import { t } from "try";
import store from "../store";
import Icon from "../components/icon";

export const Player: Component<
	{},
	{},
	{
		player: HTMLElement;
		link: string | undefined;
		mbid: string;
	}
> = function () {
	const playSong = async (mbid: string) => {
		if (this.link) URL.revokeObjectURL(this.link);
		this.link = undefined;
		this.player = (
			<div class="loader">
				<Icon name="search_doc" />
			</div>
		);
		const response = await t(
			fetch(`/api/source/track?mbid=${mbid}&source=${store.source}`)
		);
		if (!response.ok) {
			this.player = <div>an error occured: {response.error}</div>;
			console.error(response.error);
			return;
		}
		switch (response.value.status) {
			case 200:
				this.player = <div>playing in webamp!</div>;
				break;
			case 404:
				this.player = <div>file not in cache</div>;
				return;
			case 500:
				this.player = <div>error: {response.error}</div>;
				return;
			default:
				this.player = <div>unknown error or lack of response</div>;
				return;
		}
		const blob = await response.value.blob();
		const link = URL.createObjectURL(blob);
		this.link = link;

		if (!window.webamp) {
			const player = new Audio(link);
			player.controls = true;
			player.play();
			this.player = player;
			return;
		}
		const recordingInfo = await window.mb.RecordingInfo(mbid);
		window.webamp.setTracksToPlay([
			{
				metaData: {
					title: recordingInfo.title,
					artist: recordingInfo.artists[0].name,
				},
				blob,
			},
		]);
	};

	const deleteCached = async (mbid: string) => {
		this.player = <div>loading...</div>;
		const response = await t(fetch(`/api/deleteItem?mbid=${mbid}`));

		if (!response.ok) {
			this.player = <div>an error occured: {response.error}</div>;
			console.error(response.error);
			return;
		}

		switch (response.value.status) {
			case 200:
				this.player = <div>deleted item from cache</div>;
				break;
			case 404:
				this.player = <div>file not in cache</div>;
				break;
			case 500:
				this.player = <div>error: {response.error}</div>;
				break;
			default:
				this.player = <div>unknown error or lack of response</div>;
		}
	};

	use(this.mbid).listen(playSong);
	return (
		<div class="input-row">
			<input
				id="recordingMbid"
				value={use(this.mbid)
					.map((val) => decodeURIComponent(val))
					.bind()}
				type="text"
			/>
			<button on:click={() => playSong(this.mbid)}>fetch song</button>
			<button on:click={() => deleteCached(this.mbid)}>
				delete from cache
			</button>
			{use(this.link).andThen(<button on:click={()=> window.open(this.link)}>download song</button>)}
			<br />
			{use(this.player)}
		</div>
	);
};

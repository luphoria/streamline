import type { Component, ComponentInstance } from "dreamland/core";
import { error, t } from "try";
import store from "../store";

export const Player: Component<
	{},
	{},
	{
		player: HTMLElement;
		mbid: string
	}
> = function (cx) {
	const playSong = async (mbid: string) => {
		this.player = <div>loading...</div>;
		console.log(store.source)
		const response = await t(
			fetch(`/api/sourceTrack?mbid=${mbid}&source=${store.source}`)
		);
		if (!response.ok) {
			this.player = <div>an error occured: {response.error}</div>;
			console.error(response.error);
			return;
		}
		const blob = await response.value.blob();

		const url = URL.createObjectURL(blob);
		const player = new Audio(url);
		player.controls = true;
		player.play();
		this.player = player;
	};

	const deleteCached = async (mbid: string) => {
		this.player = <div>loading...</div>;
		const response = await t(
			fetch(`/api/deleteItem?mbid=${mbid}`)
		);

		if (!response.ok) {
			this.player = <div>an error occured: {response.error}</div>;
			console.error(response.error);
			return;
		}

		switch (response.value.status) {
			case 200: 
				this.player = <div>deleted item from cache</div>
				break;
			case 404:
				this.player = <div>file not in cache</div>
				break;
			case 500: 
				this.player = <div>error: ${response.error}</div>
				break;
			default: 
				this.player = <div>unknown error or lack of response</div>
		}

	}

	// TODO : use mbid 
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
			<button on:click={() => deleteCached(this.mbid)}>delete from cache</button>
			<br />
			{use(this.player)}
		</div>
	);
};

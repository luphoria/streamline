import type { Component, ComponentInstance } from "dreamland/core";
import { error, t } from "try";

export const Player: Component<{},{},
	{
		player: HTMLElement;
		input: string;
	}
> = function (cx) {
	const playSong = async (input) => {
		this.player = <div>loading...</div>;
		const response = await t(
			fetch(`/api/source?query=${encodeURIComponent(input)}`)
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
	use(this.input).listen(playSong);
	return (
		<div class="input-row">
			<input id="recordingId" value={use(this.input).bind()} type="text" />
			<button on:click={() => playSong(this.input)}>fetch song</button>
			<br />
			{use(this.player)}
		</div>
	);
};

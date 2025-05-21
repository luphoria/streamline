import { scope, Component, ComponentInstance } from "dreamland/core";

export const Player: Component<
	{},
	{
		update: (input: string) => Promise<void>;
	},
	{
		player: HTMLAudioElement;
		input: string;
	}
> = function (cx) {
	this.update = async (input) => {
		try {
			const response = await fetch(
				`/api/source?query=${encodeURIComponent(input)}`
			);
			const blob = await response.blob();

			const url = URL.createObjectURL(blob);
			const player = new Audio(url);
			player.controls = true;
			player.play();
			this.player = player;
		} catch (err) {
			console.error(err);
		}
	};
	return (
		<div>
			<input id="recordingId" value={use(this.input).bind()} />
			<button on:click={() => this.update(this.input)}>fetch song</button>
			{use(this.player)}
		</div>
	);
};

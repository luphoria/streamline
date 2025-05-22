import { scope, Component, ComponentInstance } from "dreamland/core";
import { error, t } from "try";

export const Player: Component<
	{},
	{
		update: (input: string) => Promise<void>;
	},
	{
		player: HTMLElement;
		input: string;
	}
> = function (cx) {
	this.update = async (input) => {
		this.input = input;
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
	return (
		<div class="input-row">
			<input id="recordingId" value={use(this.input).bind()} type="text" />
			<button on:click={() => this.update(this.input)}>fetch song</button>
			<br />
			{use(this.player)}
		</div>
	);
};

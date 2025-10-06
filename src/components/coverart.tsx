import { css, type Component } from "dreamland/core";
const CoverArt: Component<{
	src: string | undefined;
	class?: string;
	size?: number;
}> = function () {
	this.size = this.size || 32;
	return (
		<img
			class={`component-coverart ${this.class}`}
			height={use(this.size)}
			width={use(this.size)}
			src={use(this.src)}
			on:error={(e: any) => {
				let el = e.target as HTMLImageElement;
				el.src = "/shell32/cd_unknown.gif";
				el.setAttribute("style", "image-rendering: pixelated; scale: 0.6;");
			}}
			alt="Cover Art"
		/>
	);
};

CoverArt.style = css`
	:scope {
		image-rendering: pixelated;
		aspect-ratio: 1 / 1;
	}
`;

export default CoverArt;

import type { Component } from "dreamland/core";
export const CoverArt: Component<{
  src: string | undefined;
	class?: string;
	size?: number;
}> = function (cx) {
	cx.css = `
    :scope {
      image-rendering: pixelated;
      aspect-ratio: 1 / 1;
    }
  `;
	this.size = this.size || 32;
	return (
		<img
		  class={`component-coverart ${this.class}`}
			height={this.size}
			width={this.size}
			src={this.src}
			on:error={(e: any) => {
				let el = e.target as HTMLImageElement;
				el.src = "/public/shell32/cd_unknown.gif";
				el.style = "image-rendering: pixelated; scale: 0.6;";
			}}
			alt="Cover Art"
		/>
	);
};

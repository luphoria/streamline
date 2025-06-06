import type { Component } from "dreamland/core";
export const Icon: Component<{
	name: string;
  class?: string;
  size?: number;
}> = function (cx) {
  cx.css = `
    :scope {
      image-rendering: pixelated;
      width: auto;
    }
  `
  this.size = this.size||32;
	return (
    <img height={this.size} src={`/shell32/${this.name}.gif`} class={`component-icon ${this.class}`} alt={this.name.replace("_", " ")} on:error={(e: any) => {
      let el = e.target as HTMLImageElement;
      el.src = "/shell32/prohibited.gif";
    }} />
	);
};

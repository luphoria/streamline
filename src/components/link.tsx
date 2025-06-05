import type { Component, ComponentInstance } from "dreamland/core";
export const Link: Component<{
	href: string;
	class?: string;
}> = function (cx) {
	return (
		<a
			href={this.href}
			class={`component-link ${this.class}`}
			on:click={(e) => {
				e.preventDefault();
				if (!window.r) throw new Error("No router exists");
				window.r.navigate((cx.root as HTMLAnchorElement).href);
			}}
		>
			{cx.children}
		</a>
	);
};

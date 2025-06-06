import type { Component } from "dreamland/core";
export const Link: Component<{
	href: string;
	class?: string;
}> = function (cx) {
	return (
		<a
			href={this.href}
			class={`component-link ${this.class}`}
			on:click={(e: any) => {
				e.preventDefault();
				// @ts-expect-error
				if (!window.r) throw new Error("No router exists");
				// @ts-expect-error
				window.r.navigate((cx.root as HTMLAnchorElement).href);
			}}
		>
			{cx.children}
		</a>
	);
};

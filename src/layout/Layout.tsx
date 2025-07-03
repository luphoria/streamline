import type { Component } from "dreamland/core";
import Navbar from "./Navbar";
import Webamp from "webamp";
import isMobile from "is-mobile";

const Layout: Component<
	{},
	{ outlet: Element; container: HTMLElement; player: HTMLElement }
> = function (cx) {
	cx.css = `
    :scope {
      height: 100%;
      width: calc(100%);
      display: flex;
      flex-direction: row;
    }

    main {
      justify-content: center;
      flex: 1;
      overflow-y: auto;
      padding: 1.5em;
    }
  `;
	cx.mount = () => {
		if (!Webamp.browserIsSupported() || isMobile()) {
			return;
		}
		window.webamp = new Webamp({
			//@ts-expect-error this will be added in webamp 2.1.3
			enableMediaSession: true,
			initialSkin: {
				url: "/skin.wsz",
			},
		});
		window.webamp.renderWhenReady(this.player);
	};
	return (
		<div>
			<Navbar />
			<main this={use(this.container).bind()}>
				<fieldset>{use(this.outlet)}</fieldset>
			</main>
			<div id="player" this={use(this.player).bind()}></div>
		</div>
	);
};

export default Layout;

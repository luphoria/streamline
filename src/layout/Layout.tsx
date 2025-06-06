import type { Component } from "dreamland/core";
import Navbar from "./Navbar";

const Layout: Component<{}, { outlet: Element }> = function (cx) {
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
	return (
		<div>
			<Navbar />
			{/* @ts-expect-error */}
			<main this={use(this.container).bind()}><fieldset>{use(this.outlet)}</fieldset></main>
		</div>
	);
};

export default Layout;

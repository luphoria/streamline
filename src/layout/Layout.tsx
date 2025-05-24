import type { Component, ComponentInstance } from "dreamland/core";
import Navbar from "./Navbar";

const Layout: Component<{}, { outlet: Element }> = function (cx) {
	cx.css = `
    :scope {
      height: 100%;
      width: calc(100%);
      display: flex;
      flex-direction: column;
    }

    main {
      justify-content: center;
      flex: 1;
    }
  `;
	return (
		<div>
			<Navbar />
			<main this={use(this.container).bind()}>{use(this.outlet)}</main>
		</div>
	);
};

export default Layout;

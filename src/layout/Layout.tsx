import type { Component, ComponentInstance } from "dreamland/core";

const Layout: Component<{}, { outlet: Element }> = function (cx) {
  cx.css = `
    height: 100%;
    width: calc(100%);
    display: flex;
    flex-direction: column;

    main {
      flex: 1;
    }
  `;
  return (
    <div>
      <main this={use(this.container).bind()}>
        {use(this.outlet)}
      </main>
    </div>
  );
};

export default Layout;
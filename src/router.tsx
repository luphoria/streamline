import { Route, Router } from "dreamland-router";

import Home from "./routes/Home";

import Layout from "./layout/Layout";

export default new Router(
  (
    <Route show={<Layout />}>
      <Route path="/" show={<Home />} />
    </Route>
  ),
);
import { Route, Router } from "dreamland-router";

import Home from "./routes/home";

import Layout from "./layout/Layout";
import { ArtistView } from "./routes/artist";
import { ReleaseView } from "./routes/release";
import { Search } from "./routes/search";
import { Settings } from "./routes/settings";

export default new Router(
  (
    <Route show={<Layout />}>
      <Route path="/" show={<Home />} />
      <Route path="/search/:query" show={<Search />} />
      <Route path="/artist/:mbid" show={<ArtistView />} />
      <Route path="/release/:mbid" show={<ReleaseView />} />
      <Route path="/settings" show={<Settings />} />

      <Route path="*" show={<Home />} />
    </Route>
  ),
);
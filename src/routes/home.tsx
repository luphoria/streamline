import type { Component, ComponentInstance } from "dreamland/core";
import { Link } from "../components/link";
export const Home: Component = function (cx) {
	return (
		<div>
			<h2>streamline</h2>
			<Link href="/settings">open settings</Link>
		</div>
	);
};
export default Home;

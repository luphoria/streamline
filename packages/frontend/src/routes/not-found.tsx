import type { Component } from "dreamland/core";
import { Link } from "dreamland/router";

const NotFound: Component = function () {
	return (
		<div>
			<h2>Not Found</h2>
            <Link href="/">Go Home</Link>
		</div>
	);
};
export default NotFound;

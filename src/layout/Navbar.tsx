import { css, type Component } from "dreamland/core";
import router from "../router";
import Link from "../components/link";

const Navbar: Component<{}, {}, {
    query: string;
}> = function () {
	this.query = "";
	return (
		<header>
			<div class="title">
				<Link href="/">
					<img
						src="/streamline-temp-logo.png"
						alt="Streamline Logo"
						id="logo"
					/>
				</Link>
			</div>
			<div id="searchbar">
				<form
					on:submit={(e: any) => {
						e.preventDefault();
						router.navigate(`/search/${encodeURIComponent(this.query)}`);
					}}
				>
					<input
						type="text"
						id="songSearchValue"
						placeholder="ARTIST - SONG or search..."
						value={use(this.query).bind()}
					/>
					<button id="songSearchBtn" type="submit">
						Search!
					</button>
				</form>
			</div>

			<ul class="tree-view">
				<li>
					<ul>
						<li>
							<Link href="/">Home</Link>
						</li>
						<li>
							<Link href="/settings">Settings</Link>
						</li>
					</ul>
				</li>
			</ul>
		</header>
	);
};

Navbar.style = css`
    :scope {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        padding: 1.5rem;
        align-items: flex-start;
        height: 100vh;
        width: 25em;
        flex-shrink: 0;
        gap: 1em;

        background: var(--bg-grad);
        color: var(--on-grad);

        font-size: 0.9rem;
    }

    /* Searchbar */
    #searchbar {
        display: flex;
        justify-content: space-evenly;
        flex-wrap: wrap;
        gap: 0.5rem;
        width: 100%;
    }

    #searchbar > form {
        flex-grow: 1;
        display: flex;
        gap: 0.5rem;
    }

    #searchbar input {
        flex-grow: 1;
    }

    .title {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        margin: auto;
    }

    #logo {
        height: 12em;
        user-select: none;
    }

    .home {
        text-decoration: none;
        font-size: 3rem !important;
        font-weight: 600;
        font-style: oblique;
        letter-spacing: -0.05em;
        color: var(--on-grad);
    }

    .home:hover {
        text-decoration: underline;
    }

    ul {
        width: 100%;
        height: 100%;
        color: var(--on-solid);
    }
`
export default Navbar;

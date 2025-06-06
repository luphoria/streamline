import type { Component } from "dreamland/core";
import router from "../router";
import { Link } from "../components/link";
const Navbar: Component<{}, {}, {}> = function (cx) {
    // @ts-expect-error
    this.songQuery = "";
	cx.css = `
\       :scope {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            padding: 1.5rem;
            align-items: flex-start;
            background-color: var(--mantle);
            height: 100vh;
            width: 25em;
            flex-shrink: 0;
            gap: 1em;
            box-shadow: 0 -4px 8px 0 var(--mantle);

            background: var(--bg-grad);
            color: var(--on-grad);

            font-size: 0.9rem;
        }

        /* Searchbar */
        #searchbar {
            display: flex;
            justify-content: space-evenly;
            flex-wrap: wrap;
            gap: 0.5rem 2rem;
            width: 100%;
        }

        #searchbar > span {
            flex-grow: 1;
            display: flex;
            gap: 0.5rem;
        }

        #searchbar > span > input {
            flex-grow: 1;
        }


        .home {
          font-size: 3rem!important;
          color: var(--on-grad);
          text-decoration: none;
          font-weight: regular;
        }

        .home:hover {
          text-decoration: underline;
        }
    `;
	return (
		<header>
  	 <a
  			href="/"
  			class="home"
  			on:click={(e: any) => {
  				e.preventDefault();
                // @ts-expect-error
  				if (!window.r) throw new Error("No router exists");
                // @ts-expect-error
  				window.r.navigate((cx.root as HTMLAnchorElement).href);
  			}}
  		>
  			Streamline
  		</a>
			<div id="searchbar">
				<span>
					<input
						type="text"
						id="songSearchValue"
						placeholder="ARTIST - SONG or search..."
						// @ts-expect-error
						value={use(this.songQuery).bind()}
					/>
					<button
						id="songSearchBtn"
						// @ts-expect-error
						on:click={() => router.navigate(`/search/${encodeURIComponent(this.songQuery)}`)}
					>
						Search!
					</button>
				</span>
			</div>

			{/* @ts-expect-error */}
			<Link href="/settings">Settings</Link>
		</header>
	);
};

export default Navbar;

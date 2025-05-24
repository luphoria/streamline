import type { Component, ComponentInstance } from "dreamland/core";
import router from "../router";
const Navbar: Component<{}, {}, {}> =
  function (cx) {
    cx.css = `
\       :scope {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background-color: var(--mantle);
            height: 50px;
            flex-shrink: 0;
            gap: 32px;
            box-shadow: 0 -4px 8px 0 var(--mantle);
            margin-top: 32px;
        }
        
        /* Searchbar */
        #searchbar {
            position: absolute;
            top: 1rem;
            left: 0;
            right: 0;

            display: flex;
            justify-content: space-evenly;
            flex-wrap: wrap;
            gap: 0.5rem 2rem;
            padding: 0 2rem;
        }

        #searchbar > span {
            flex-grow: 1;
            display: flex;
            gap: 0.5rem;
        }

        #searchbar > span > input {
            flex-grow: 1;
        }
    `
    return (
      <header>
        <div id="searchbar">
            <span>
                <input
                    type="text"
                    id="songSearchValue"
                    placeholder="ARTIST - SONG or search..."
                    value={use(this.songQuery).bind()}
                />
                <button
                    id="songSearchBtn"
                    on:click={() => router.navigate(`/search/${this.songQuery}`)}
                >
                    Search song
                </button>
            </span>
        </div>
      </header>
    );
  };

export default Navbar;
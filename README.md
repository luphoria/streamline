# streamline

Streamline is a project dedicated to bring the music to metadata - NOT the other way around. We index the entire catalog of MusicBrainz, and per user request, find audio for the release requested by the user.

## TODO

This project is extremely new and just partially functional. In rough order of priority,

- **Chunking** response data is currently broken.
- **main.js** is currently incomplete.
- **Caching** songs that have been requested and album covers that have been downloaded by the user.
- **Further cover art sourcing.** #1
- **Client-side release group options.**
- **Smart release group release pick.**
- **Better MusicBrainz search.**
- **Server-side client data management** such as playlists, listening history, ....
- **UI.**
- **The other stuff.**

## Run

`pnpm run dev` and `node main.js`

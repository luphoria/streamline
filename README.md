# streamline
Streamline is a project dedicated to bring the music to metadata - NOT the other way around. 

# Put a screenshot here, or something, probably

Streamline works as an interface to the entire library catalog of MusicBrainz, and per user request, finding audio for the song or release requested by the user!

## Install

### Dependencies
- Streamline itself runs on Node.js (v20 or higher), and uses `pnpm` for node package management.
- Each plugin (i.e. `server/sources/slsk`, `server/sources/yt-dlp`) has its own related configuration (typically they rely on a separate running HTTP server or local binary); implementations are declared in `server/.env.js.example`. For ease of access, some existing plugins are included and have examples included in the repository. 
 * The SoundCloud and YouTube example plugins both rely on [yt-dlp](https://yt-dlp) **at the latest version**. 
 * The SoulSeek example plugin relies on [slskd](https://github.com/slskd/slskd). 
 * The Qobuz example plugin uses [Qobuz-DL](https://github.com/QobuzDL/Qobuz-DL). 

### Setup
- Configuring the Streamline server can be done from the `server/.env.js` file. `server/.env.js.example` is included with explanations for what your configuration should look like. 
- Add source plugins in the `server/sources` folder, then define and configure them in `server/.env.js`. **Example plugins have already been included for ease of access!** These plugins are *example implementations* for reference when creating your own, but they also work out of the box, as described. 
- `pnpm i` will install all of the node dependencies. 

## Run
Ensure that your plugin APIs (e.g. slskd, Qobuz-DL) are running as well, and then run

`pnpm run dev` 🎉

## TODO
Feel free to contribute!!

https://github.com/users/luphoria/projects/1
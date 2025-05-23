# streamline

Streamline is a project dedicated to bring the music to metadata - NOT the other way around. Streamline indexes the entire catalog of MusicBrainz, and per user request, find audio for the release requested by the user.

## TODO

https://github.com/users/luphoria/projects/1

## Install
### Requires
- https://github.com/slskd/slskd
- https://github.com/yt-dlp/yt-dlp/ (LATEST)
- https://pnpm.io/installation

### Setup
- Copy `.env.js.example` to `.env.js`. 
- `slskd.yml`:
  * Create a SoulSeek account (on Nicotine+ is easy) and add the username and password to `soulseek: username` and `soulseek: password`. 
  * Note the `directories: downloads` configuration and add it to `.env.js` under `slskd.path`.
  * Enable `web: authentication: api_key` and create any api key, then add it to `.env.js` under `slskd.apikey`.
  * The other default .env.js settings should work by default unless you've changed other parts of slskd config.
- yt-dlp should need no additional configuration, but create a youtube downloads folder and set that to the path in `.env.js`. 
  * Ensure that yt-dlp is at the latest version (as of writing: `2025.05.22` is confirmed to work). Some recent-but-outdated versions dont work.
  * If `yt-dlp` is not in your PATH, set `ytdlp.binary` in `.env.js` to the path to the correct binary. 
- `pnpm i`

## Run

`pnpm run dev` (make sure slskd is running as well).

// Server settings.
export const MB_URL = "https://musicbrainz.org/ws/2/";

// Default client settings.
export const settings = {
	MB_URL: "https://musicbrainz.org/ws/2/", // Client MusicBrainz API. This can be self-hosted.
	source: "folder", // the default client-requested source
};

// -- -- -- //

/* Below are various example configurations for
   Streamline source plugins which are included
   for ease of access.

   For  source plugins, the server prioritizes
   first the cache, then
   the client-requested source, then (on failure)
   down the list of any other source plugins.
*/

export const folder = {
	path: "C:\\Users\\user\\Music\\!RIPS\\",
	tries: 1,
};

export const slskd = {
	// SoulSeek wrapper: https://github.com/slskd/slskd
	url: "http://localhost:5030",
	username: "", // Your soulseek account username (register with Nicotine+)
	password: "", // Your soulseek account password
	/* Your slskd API key (for the HTTP API).
	!!NOTE: Create the API key manually in `slskd.yml`: !!
	web: => authentication: => api_key
	*/
	apikey: "YOUR_API_KEY_HERE", // !!! You have to declare and create this key
	path: "/home/[user]/.local/share/slskd/downloads/", // Make sure slskd is set to download here
	allowFiletypes: [".mp3", ".flac", ".ogg", ".m4a", ".wma"],
	tries: 3,
};

export const ytdlp = {
	/*
	YouTube Music wrapper: https://github.com/yt-dlp/yt-dlp
	**Ensure that yt-dlp is at the latest version**
	(as of writing: `2025.05.22` is confirmed to work,
	but stable releases from earlier in the year did not)
	*/
	binary: "yt-dlp", // Binary path for yt-dlp.
	path: "./music/yt-dlp",
};

export const soundcloud = {
	/* SoundCloud wrapper: https://github.com/yt-dlp/yt-dlp
	**Ensure that yt-dlp is at the latest version**
	(as of writing: `2025.05.22` is confirmed to work,
	but stable releases from earlier in the year did not)
	*/
	ytdlpBinary: "yt-dlp", // Binary path for yt-dlp (which also includes a soundcloud downloader).
	path: "./music/soundcloud",
};

export const qobuz = {
	/*
	Qobuz wrapper: https://github.com/QobuzDL/Qobuz-DL
	TODO: Instead shuffle an array of different qobuz-dl instances.
	*/
	qobuzDlUrl: "http://localhost:2222", // https://qobuz.squid.wtf
	path: "./music/qobuz/",
	tries: 2,
};

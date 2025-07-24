export const slskd = {
	url: "http://localhost:5030",
	username: "",
	password: "",
	apikey: "YOUR_API_KEY_HERE",
	path: "/home/[user]/.local/share/slskd/downloads/",
	allowFiletypes: [".mp3", ".flac", ".ogg", ".m4a", ".wma"],
};

export const ytdlp = {
	binary: "yt-dlp",
	path: "./music/soundcloud",
};

export const soundcloud = {
	ytdlpBinary: "yt-dlp",
	path: "./music/yt-dlp",
};

export const qobuz = {
	qobuzDlUrl: "https://eu.qobuz.squid.wtf",
	path: "./music/qobuz/",
};

// config options that get sent down to the client
export const MB_URL = "https://musicbrainz.org/ws/2/";
export const defaultSource = "qobuz";
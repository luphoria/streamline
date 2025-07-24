export interface SongVersion {
	mbid: string;
	title: string;
	artists: { name: string; mbid: string }[];
	versions: Release[];
	length: number | null;
	hasVideo: boolean;
	releaseDate: string;
	score: number;
}

export interface Release {
	mbid: string;
	title: string;
	artist: string;
	releaseDate: string;
	coverArt: string | null;
	disambiguation: string | null;
	country: string | null;
	status: string | null;
	secondaryType: string | null;
	score: number;
}

export interface RecordingGroup {
	artists: [{ name: string; mbid: string }];
	title: string;
	versions: Release[];
	hasVideo: boolean;
	score: number;
	releaseDate: string;
	mbid: string;
}

// TODO: We can type this more.
export interface ReleaseGroupList {
	[key: string]: any;
}

// interface Song {
// 	title: string;
// 	versions: SongVersion[];
// 	score: number;
// }

// type SongArray = Song[];

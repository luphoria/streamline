import { atom } from "nanostores";

export interface SongVersion {
	mbid: string;
	parentMbid: string | null;
	title: string;
	artist: string;
	releaseTitle: string;
	length: number | null;
	coverArt: string | null;
	hasVideo: boolean;
	releaseDate: string;
	score: number;
}

export interface SongGroup {
	artist: string;
	title: string;
	versions: SongVersion[];
	hasVideo: boolean;
	score: number;
}

interface Song {
	title: string;
	versions: SongVersion[];
	score: number;
}

type SongArray = Song[];

// This creates an atom to store an array of SongArray
export const $results = atom<SongArray[]>([]);

// Function to add a new SongArray to the results
export function addResult(songs: SongArray) {
	$results.set([...$results.get(), songs]);
}

// Function to clear all results
export function removeAllResults() {
	$results.set([]);
}

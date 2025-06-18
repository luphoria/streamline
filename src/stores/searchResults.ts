// @ts-expect-error
import { atom } from "nanostores";

export interface SongVersion {
	mbid: string;
	title: string;
	artists: [{ name: string; mbid: string }];
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

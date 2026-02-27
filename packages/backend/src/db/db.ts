import Database from "better-sqlite3";
import { type IArtistCredit } from "musicbrainz-api";

const db = new Database("./streamline.db");

// Sqlite3 does not directly support UUIDS, so MBID is just a string
/*
releases {
  mbid: {
	mbid: release-group [required, unique, primary]
	artists: json[{name, mbid}]
	title: string
	disambiguation: string,
	country: string
  }
}
songs {
  mbid: {
    mbid: [required, unique, primary]
	artists: json[{name, mbid}]
	title: string
	release-group: mbid (string)
    filepath: [required]
    source?: string
  }
}
*/

db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      mbid TEXT UNIQUE PRIMARY KEY,
      filepath TEXT NOT NULL,
      source TEXT NOT NULL,
	  artists TEXT NOT NULL,
	  title TEXT NOT NULL,
	  release TEXT NOT NULL,
	  release_date TEXT
    )
`);
/*
db.exec(`
    CREATE TABLE IF NOT EXISTS releases (
      mbid TEXT UNIQUE PRIMARY KEY,
	  artists TEXT NOT NULL,
	  title TEXT NOT NULL,
	  country TEXT,
	  disambiguation TEXT, 
	  release-date TEXT
    )
`);
*/
export function AddRecording(
	mbid: string,
	filepath: string,
	source: string,
	artists: IArtistCredit[],
	title: string,
	release: string,
	releaseDate?: string
) {
	console.log(
		`DB: ${artists[0]} - ${title}: ${mbid}/release-${release} / ${filepath} (${source})`
	);
	const insert = db.prepare(
		"INSERT INTO songs (mbid, filepath, source, artists, title, release, release_date) VALUES (?, ?, ?, ?, ?, ?, ?)"
	);

	return insert.run(
		mbid,
		filepath,
		source,
		JSON.stringify(artists),
		title,
		release,
		releaseDate
	);
}

export function GetRecording(mbid: string) {
	const get = db.prepare("SELECT * FROM songs WHERE mbid = ?");

	return get.get(mbid);
}

export function DeleteRecording(mbid: string) {
	const del = db.prepare("DELETE FROM songs WHERE mbid = ?");

	return del.run(mbid);
}

import Database from "better-sqlite3";

const db = new Database("./streamline.db");

// Sqlite3 does not directly support UUIDS, so MBID is just a string
/*
songs {
  mbid: {
    mbid: [required, unique]
    filepath: [required]
    source?: string
  }
}
*/
db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      mbid TEXT UNIQUE PRIMARY KEY,
      filepath TEXT NOT NULL,
      source TEXT
    )
`);

export const AddRecording = (mbid, filepath, source?) => {
	console.log(`DB: ${mbid} / ${filepath} (${source})`);
	const insert = db.prepare(
		"INSERT INTO songs (mbid, filepath, source) VALUES (?, ?, ?)"
	);

	return insert.run(mbid, filepath, source);
};

export const GetRecording = (mbid) => {
	const get = db.prepare("SELECT * FROM songs WHERE mbid = ?");

	return get.get(mbid);
};

export const DeleteRecording = (mbid) => {
	const del = db.prepare("DELETE FROM songs WHERE mbid = ?");

	return del.run(mbid);
};

const Database = require("better-sqlite3");

const db = new Database("./streamline.db");

// Sqlite3 does not directly support UUIDS, so MBID is just a string
/*
  mbid: {
    mbid: [required, unique]
    filepath: [required]
    source?: string
  }
*/
db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      mbid TEXT UNIQUE PRIMARY KEY,
      filepath TEXT NOT NULL,
      source TEXT
    )
`);

const AddRecording = (mbid, filepath, source) => {
	const insert = db.prepare(
		"INSERT INTO songs (mbid, filepath, source) VALUES (?, ?, ?)"
	);
	console.log(insert.run(mbid, filepath, source));
};

const GetRecording = (mbid) => {
	const get = db.prepare("SELECT * FROM songs WHERE mbid = ?");
	return get.get(mbid);
};

// console.log(AddRecording("00e8d3f9-e43e-429e-9451-4050487389d9","tests/slsk-downloads/Rav - B-Sides & Rarities Vol.3 [2011-2015]/Rav - B-Sides & Rarities Vol.3 -2011-2015- - 15 ~-WiNgS-~.flac"));
console.log(GetRecording("00e8d3f9-e43e-429e-9451-4050487389d9").filepath);

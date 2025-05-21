import type { SongGroup, SongVersion } from "../stores/searchResults";
import DOMPurify from "dompurify";

export class MusicBrainz {
	apiUrl: string;
	userAgent: string;
	constructor(apiUrl, userAgent?) {
		console.info("== MusicBrainz: new MusicBrainz class instance created ==");
		this.apiUrl = apiUrl;
		this.userAgent = userAgent
			? userAgent
			: "python-musicbrainz/0.7.3 ( john.pork42@gmail.com )";
	}

	// should not be used outside of this file. queries musicbrainz api
	releaseFetch = async (path) => {
		const res = await (
			await fetch(this.apiUrl + path, {
				headers: {
					"User-Agent": this.userAgent,
				},
			})
		).json();

		return res;
	};

	SetApiUrl = (URL) => {
		this.apiUrl = URL;

		return this.apiUrl;
	};

	// Returns a string (url)
	HdCoverArtUrl = async (mbid) => {
		const coverArtFetch = await (
			await fetch(`https://coverartarchive.org/release/${mbid}`)
		).json();
		// Grab first image
		const res = coverArtFetch["images"][0]["image"]
			? coverArtFetch["images"][0]["image"]
			: null;

		return res;
	};

	// Release
	ReleaseInfo = async (mbid) => {
		const releaseFetch = await this.releaseFetch(
			`release/${mbid}?inc=recordings+release-groups+artists&fmt=json`
		);

		console.info("ReleaseInfo: releaseFetch:");
		console.info(releaseFetch);

		let coverArt = null;
		if (releaseFetch["cover-art-archive"])
			coverArt = releaseFetch["cover-art-archive"]["artwork"];

		const res = {
			title: releaseFetch["title"],
			artists: [],
			trackList: [],
			coverArt: coverArt,
			mbid: mbid,
			releaseGroup: releaseFetch["release-group"]
				? releaseFetch["release-group"]["id"]
				: null,
		};

		// Populate artists
		for (const artist in releaseFetch["artist-credit"]) {
			res.artists.push({
				name: releaseFetch["artist-credit"][artist].name,
				mbid: releaseFetch["artist-credit"][artist]["artist"]["id"],
			});
		}

		// Populate track list
		for (const track in releaseFetch["media"][0]["tracks"]) {
			res.trackList.push({
				title: releaseFetch["media"][0]["tracks"][track]["title"],
				mbid: releaseFetch["media"][0]["tracks"][track]["id"],
			});
		}

		console.info("== ReleaseInfo: res: ==");
		console.info(res);

		return res;
	};

	// Artist
	ArtistInfo = async (mbid) => {
		const artistFetch = await this.releaseFetch(
			`artist/${mbid}?inc=release-groups+releases&fmt=json`
		);
		console.info("ArtistInfo: artistFetch:");
		console.info(artistFetch);

		const res = {
			name: artistFetch.name,
			disambiguation: artistFetch.disambiguation
				? artistFetch.disambiguation
				: null,
			releaseGroups: {
				album: [],
				single: [],
				ep: [],
				live: [],
				compilation: [],
				all: [], // Is this necessary?
			},
		};

		for (const releaseGroup in artistFetch["release-groups"]) {
			const resReleaseGroup = {
				title: artistFetch["release-groups"][releaseGroup]["title"],
				date: artistFetch["release-groups"][releaseGroup]["first-release-date"],
				mbid: artistFetch["release-groups"][releaseGroup]["id"],
				type: artistFetch["release-groups"][releaseGroup]["primary-type"]
					? artistFetch["release-groups"][releaseGroup][
							"primary-type"
						].toLowerCase()
					: "release",
			};

			// Add all of the releases to one object -- not sure if we will need this.
			res.releaseGroups.all.push(resReleaseGroup);

			// Sort the release by its primary type.
			switch (artistFetch["release-groups"][releaseGroup]["primary-type"]) {
				case "Album":
					res.releaseGroups.album.push(resReleaseGroup);
					break;
				case "Single":
					res.releaseGroups.single.push(resReleaseGroup);
					break;
				case "EP":
					res.releaseGroups.ep.push(resReleaseGroup);
					break;
				case "Live":
					res.releaseGroups.live.push(resReleaseGroup);
					break;
				case "Compilation":
					res.releaseGroups.compilation.push(resReleaseGroup);
					break;
				default:
					break;
			}
		}

		return res;
	};

	// Search recordings
	SearchSongs = async (query) => {
		query = "\"" + query.replaceAll(/ /g, "\" \"") + "\"";
		const data = await this.releaseFetch(
			`recording/?query=${encodeURIComponent(query)}&limit=50&fmt=json`
		);

		const songMap = new Map<string, SongVersion[]>();

		data.recordings.forEach((recording) => {
			if (!recording.releases) {
				// We don't want it
				return;
			}

			const artist = recording["artist-credit"][0].name;
			const title = recording.title;
			const key = `${artist}|${title}`;

			// Sort parent releases.
			// Possible sorting factors:
			// Country, media types (prefer digital), release date (although they should all be equal)... more?
			const releases = recording.releases;
			if (releases.length > 1) {
				releases.sort((a, b) => {
					// Sort by release media type (prefer digital) and country
					// TODO: more sorting for parent release
					if (
						a.media[0].format == "Digital Media" &&
						b.media[0].format != "Digital Media"
					)
						return -1;
					if (a.country == "XW" && b.country != "XW") return -1;

					return 1;
				});
			}

			const parentRelease = recording.releases[0];
			const parentMbid = parentRelease ? parentRelease.id : null;

			let score = recording.score;

			// Additional scoring factors
			if (recording.video !== null) score += 50; // Heavily prioritize videos
			if (parentMbid) score += 15; // Favor recordings with associated releases
			score += recording.releases.length * 4; // For each version add 4 to the score
			if (recording.length) score += 5; // Favor recordings with length information
			if (recording["first-release-date"]) score += 3; // Favor recordings with release dates

			const songVersion: SongVersion = {
				mbid: recording.id,
				parentMbid: parentMbid ? parentMbid : null,
				title: DOMPurify.sanitize(title),
				artist: DOMPurify.sanitize(artist),
				releaseTitle: parentRelease.title,
				length: recording.length,
				coverArt: parentMbid
					? `https://archive.org/download/mbid-${parentMbid}/__ia_thumb.jpg`
					: null,
				hasVideo: recording.video !== null,
				releaseDate: DOMPurify.sanitize(recording["first-release-date"] || ""),
				score: score,
			};

			if (!songMap.has(key)) {
				songMap.set(key, []);
			}

			songMap.get(key)!.push(songVersion);
		});

		const songsArray: SongGroup[] = Array.from(songMap, ([key, versions]) => {
			// Sort versions by release date (oldest first)
			versions.sort((a, b) => {
				if (b.score !== a.score) return b.score - a.score;
				// Certain releases have an empty string set for release date
				if (a.releaseDate == "") {
					return 1;
					// Releases prioritized if there is more than just a year in the release date (help filter bootlegs)
				} else if (a.releaseDate.includes("-") != b.releaseDate.includes("-")) {
					return a.releaseDate.includes("-") ? -1 : 1;
				} else {
					return (
						new Date(a.releaseDate || 0).getTime() -
						new Date(b.releaseDate || 0).getTime()
					);
				}
			});

			// If there is a release with a parent, then we filter out the releases without a parent so that cover art will always display if available.
			let hasRecordingWithParent = false;
			versions.forEach((version) => {
				if (hasRecordingWithParent) return;
				if (version.parentMbid) {
					hasRecordingWithParent = true;
				}
			});

			if (hasRecordingWithParent) {
				versions = versions.filter((release) => {
					return release.coverArt !== null;
				});
			}

			const [artist, title] = key.split("|");

			return {
				artist,
				title,
				versions,
				hasVideo: versions.some((v) => v.hasVideo),
				score: versions[0].score, // Use the highest score among versions
			};
		});

		// Sort songs: those with videos first, then by highest score
		songsArray.sort((a, b) => {
			if (a.hasVideo !== b.hasVideo) return b.hasVideo ? 1 : -1;

			return b.score - a.score;
		});

		return songsArray;
	};

	SearchArtists = async (query) => {
		// Limit is much lower for artists because there are fewer artists in general.
		// TODO: Sort artists into the main search res list by score?
		const data = await this.releaseFetch(
			`artist/?query=${encodeURIComponent(query)}&limit=10&fmt=json`
		);
		console.log(data);

		const res = [];

		for (const artist in data.artists) {
			res.push({
				name: data.artists[artist].name,
				mbid: data.artists[artist].id,
				disambiguation: data.artists[artist].disambiguation
					? data.artists[artist].disambiguation
					: null,
				score: data.artists[artist].score,
			});
		}

		return res;
	};
}

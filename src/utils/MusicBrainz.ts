import type { RecordingGroup, SongVersion } from "../stores/searchResults";
import DOMPurify from "dompurify";

export class MusicBrainz {
	apiUrl: string;
	userAgent: string;
	constructor(apiUrl: string, userAgent?) {
		console.info("== MusicBrainz: new MusicBrainz class instance created ==");
		this.apiUrl = apiUrl;
		this.userAgent = userAgent
			? userAgent
			: "python-musicbrainz/0.7.3 ( john.pork42@gmail.com )";
	}

	// should not be used outside of this file. queries musicbrainz api
	queryApi = async (path: string) => {
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

	// Recording (song)
	RecordingInfo = async (mbid) => {
		const recordingFetch = await this.queryApi(
			`recording/${mbid}?inc=artists+releases&fmt=json`
		);

		console.info("RecordingInfo: recordingFetch:");
		console.info(recordingFetch);

		const res = {
			title: recordingFetch["title"],
			artists: [],
			releases: [],
			length: recordingFetch["length"],
			releaseDate: recordingFetch["first-release-date"],
		};

		for (const artist in recordingFetch["artist-credit"]) {
			res.artists.push({
				name: recordingFetch["artist-credit"][artist]["name"],
				mbid: recordingFetch["artist-credit"][artist]["id"],
			});
		}

		for (const release in recordingFetch["release-list"]) {
			res.releases.push({
				title: recordingFetch["release-list"][release]["title"],
				disambiguation: recordingFetch["release-list"][release][
					"disambiguation"
				]
					? true
					: false,
				artists: [],
			});
			for (const artist in recordingFetch["release-list"][release][
				"artist-credit"
			]) {
				res.artists.push({
					name: recordingFetch["release-list"][release]["artist-credit"][
						artist
					]["name"],
					mbid: recordingFetch["release-list"][release]["artist-credit"][
						artist
					]["id"],
				});
			}
		}

		return res;
	};

	// Release
	ReleaseInfo = async (mbid) => {
		const releaseFetch = await this.queryApi(
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
				mbid: releaseFetch["media"][0]["tracks"][track]["recording"]["id"],
			});
		}

		console.info("== ReleaseInfo: res: ==");
		console.info(res);

		return res;
	};

	// Artist
	ArtistInfo = async (mbid) => {
		const artistFetch = await this.queryApi(
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
	SearchSongs = async (query: string) => {
		query = '"' + query.replaceAll(/ /g, '" "') + '"';
		const data = await this.queryApi(
			`recording/?query=${encodeURIComponent(query)}&limit=100&fmt=json`
		);

		let recordingsArray = [];

		data.recordings.forEach((recording) => {
			if (!recording.releases) {
				// We don't want it
				return;
			}

			console.log(recording);

			const artist = recording["artist-credit"][0].name;
			const title = recording.title;

			let recordingResult: SongVersion = {
				mbid: recording.id,
				title: DOMPurify.sanitize(title),
				artist: DOMPurify.sanitize(artist),
				versions: [],
				length: recording.length,
				hasVideo: recording.video !== null,
				releaseDate: DOMPurify.sanitize(recording["first-release-date"] || ""),
				score: recording.score,
			};

			recording.releases.forEach((release) => {
				console.log(release);
				recordingResult.versions.push({
					mbid: release.id,
					title: release.title,
					artist: recordingResult.artist,
					releaseDate: release["date"],
					coverArt: `https://archive.org/download/mbid-${release.id}/__ia_thumb.jpg`,
					disambiguation: release["disambiguation"]
						? release["disambiguation"]
						: null,
					country: release["country"] ? release["country"] : null,
					status: release["status"] ? release["status"] : null,
					secondaryType: release["secondary-types"]
						? release["secondary-types"][0]
						: null,
				});
			});

			// Remove releases with no release date
			recordingResult.versions = recordingResult.versions.filter((version) => {
				return version.releaseDate;
			});

			// Sort releases for recording
			// TODO: Improve and prefer cover 
			recordingResult.versions.sort((a, b) => {
				if (a.country != "XW" && b.country == "XW") return 1; // Deprioritize country releases
				if (a.country == "XW" && b.country != "XW") return -1;

				return (
					// Prioritize oldest
					new Date(a.releaseDate || 0).getTime() -
					new Date(b.releaseDate || 0).getTime()
				);
			});
			recordingResult.versions.sort((a, b) => {
				if (!!a.releaseDate && !!b.releaseDate) {
					return (
						// Prioritize oldest
						new Date(a.releaseDate || 0).getTime() -
						new Date(b.releaseDate || 0).getTime()
					);
				}
			});
			recordingResult.versions.sort((a, b) => {
				if (
					a.secondaryType == "Compilation" &&
					!(b.secondaryType == "Compilation")
				)
					return 1;
				if (
					b.secondaryType == "Compilation" &&
					!(a.secondaryType == "Compilation")
				)
					return -1;

				return 0;
			});
			recordingResult.versions.sort((a, b) => {
				if (a.status == "Bootleg" && !(b.status == "Bootleg")) return 1;
				if (b.status == "Bootleg" && !(a.status == "Bootleg")) return -1;

				return 0;
			});

			if (recordingResult.versions.length != 0)
				recordingsArray.push(recordingResult);
		});

		// Sort recordings 
		// TODO: Internal score-based re-rank system

		// More releases == hoisted
		recordingsArray.sort((a, b) => {
			return b.versions.length - a.versions.length;
		});

		// Higher score == hoisted
		recordingsArray.sort((a, b) => {
			return b.score - a.score;
		});
		
		// Downrank bootlegs
		recordingsArray.sort((a, b) => {
			if (
				a.versions[0].status == "Bootleg" &&
				!(b.versions[0].status == "Bootleg")
			)
				return 1;
			if (
				b.versions[0].status == "Bootleg" &&
				!(a.versions[0].status == "Bootleg")
			)
				return -1;

			return 0;
		});

		return recordingsArray;

		// If there is a release with a parent, then we filter out the releases without a parent so that cover art will always display if available.

		return {
			artist,
			title,
			versions,
			hasVideo: versions.some((v) => v.hasVideo),
			score: versions[0].score, // Use the highest score among versions
		};
	};

	SearchArtists = async (query: string) => {
		// Limit is much lower for artists because there are fewer artists in general.
		// TODO: Sort artists into the main search res list by score?
		const data = await this.queryApi(
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

import type { ReleaseGroupList, SongVersion } from "../stores/searchResults";
import DOMPurify from "dompurify";

export class MusicBrainz {
	apiUrl: string;
	userAgent: string;
	constructor(apiUrl: string, userAgent?: string) {
		console.info("== MusicBrainz: new MusicBrainz class instance created ==");
		this.apiUrl = apiUrl;
		this.userAgent = userAgent
			? userAgent
			: "python-musicbrainz/0.7.3 ( john.pork42@gmail.com )";
	}

	// should not be used outside of this file. queries musicbrainz api
	async queryApi(path: string) {
		const res = await (
			await fetch(this.apiUrl + path, {
				headers: {
					"User-Agent": this.userAgent,
				},
			})
		).json();

		return res;
	}

	SetApiUrl(URL: string) {
		this.apiUrl = URL;

		return this.apiUrl;
	}

	// Returns a string (url)
	async HdCoverArtUrl(mbid: string) {
		try {
			const coverArtFetch = await (
				await fetch(`https://coverartarchive.org/release/${mbid}`)
			).json();
			// Grab first image
			const res = coverArtFetch["images"][0]["image"]
				? coverArtFetch["images"][0]["image"]
				: null;

			return res;
		} catch (e) {
			console.error("Error fetching cover art:", e);

			return undefined;
		}
	}

	// Recording (song)
	async RecordingInfo(mbid: string) {
		const recordingFetch = await this.queryApi(
			`recording/${mbid}?inc=artists+releases&fmt=json`
		);

		const res: {
			title: string;
			artists: { name: string; mbid: string }[];
			releases: { title: string; disambiguation: boolean; artists: string[] }[];
			length: number;
			releaseDate: string;
		} = {
			title: recordingFetch["title"],
			artists: [],
			releases: [],
			length: recordingFetch["length"],
			releaseDate: recordingFetch["first-release-date"],
		};

		for (const artist in recordingFetch["artist-credit"]) {
			res.artists.push({
				name: recordingFetch["artist-credit"][artist]["name"],
				mbid: recordingFetch["artist-credit"][artist]["artist"]["id"],
			});
		}

		for (const release in recordingFetch.releases) {
			res.releases.push({
				title: recordingFetch.releases[release]["title"],
				disambiguation: recordingFetch.releases[release]["disambiguation"]
					? true
					: false,
				artists: [],
			});
			for (const artist in recordingFetch.releases[release]["artist-credit"]) {
				res.artists.push({
					name: recordingFetch.releases[release]["artist-credit"][artist][
						"name"
					],
					mbid: recordingFetch.releases[release]["artist-credit"][artist][
						"artist"
					]["id"],
				});
			}
		}

		return res;
	}

	// Release
	async ReleaseInfo(mbid: string) {
		const releaseFetch = await this.queryApi(
			`release/${mbid}?inc=recordings+release-groups+artists&fmt=json`
		);

		console.info("ReleaseInfo: releaseFetch:");
		console.info(releaseFetch);

		let coverArt = null;
		if (releaseFetch["cover-art-archive"])
			coverArt = releaseFetch["cover-art-archive"]["artwork"];

		const res: {
			title: string;
			artists: { name: string; mbid: string }[];
			trackList: { title: string; mbid: string }[];
			coverArt: any;
			mbid: string;
			releaseGroup: string | null;
		} = {
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
	}

	// Artist
	async ArtistInfo(mbid: string) {
		const artistFetch = await this.queryApi(
			`artist/${mbid}?inc=release-groups+releases&fmt=json`
		);
		const artistReleases = await this.queryApi(
			// Do we need the artistFetch for anything? I think the disambiguation, but anything else?
			`release?artist=${mbid}&inc=release-groups+artist-credits&limit=100&fmt=json`
		);
		/* TODO: MB API: Special note for releases: To ensure requests can complete without timing out, we limit the number of releases 
		returned such that the entire list contains no more than 500 tracks. 
		(However, at least one full release is always returned, even if it has more than 500 tracks; we don't return "partial" 
		releases.) This means that you may not get 100 releases per page if you set limit=100; in fact the number will vary per 
		page depending on the size of the releases. In order to page through the results properly, increment offset by the number of 
		releases you get from each response, rather than the (larger, fixed) limit size.
		*/
		// This breaks for artists with a ton of releases (i.e. the beatles).
		// If we have a cleaner way to get both release-groups and releases, we could bypass pagination as well.

		console.info("ArtistInfo: artistFetch:");
		console.info(artistFetch);
		console.info("ArtistInfo: artistReleases:");
		console.info(artistReleases);
		const res: {
			name: string;
			disambiguation: string | null;
			releaseGroups: any;
		} = {
			name: artistFetch.name,
			disambiguation: artistFetch.disambiguation
				? artistFetch.disambiguation
				: null,
			releaseGroups: [],
		};

		// TODO: We can type this more deliberately. 
		const releaseGroups: ReleaseGroupList = {};

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
				releases: [],
			};

			// Add all of the releases to one object -- not sure if we will need this.
			releaseGroups[resReleaseGroup.mbid] = resReleaseGroup;
		}

		for (const release in artistReleases["releases"]) {
			if (artistReleases["releases"][release]["release-group"]) {
				const releaseGroupId =
					artistReleases["releases"][release]["release-group"]["id"];
				if (Object.keys(releaseGroups).includes(releaseGroupId)) {
					releaseGroups[releaseGroupId].releases.push({
						title: artistReleases["releases"][release]["title"],
						disambiguation: artistReleases["releases"][release][
							"disambiguation"
						]
							? artistReleases["releases"][release]["disambiguation"]
							: null,
						mbid: artistReleases["releases"][release]["id"],
					});
				}
			}
		}

		res.releaseGroups = [...Object.values(releaseGroups)];

		console.log(res);

		return res;
	}

	// Search recordings
	async SearchSongs(query: string) {
		query = "\"" + query.replaceAll(/ /g, "\" \"") + "\"";
		const data = await this.queryApi(
			`recording/?query=${encodeURIComponent(query)}&limit=100&fmt=json`
		);

		// eslint-disable-next-line
		let recordingsArray: any[] = [];

		data.recordings.forEach((recording: any) => {
			if (!recording.releases) {
				// We don't want it
				return;
			}

			const title = recording.title;

			const recordingResult: SongVersion = {
				mbid: recording.id,
				title: DOMPurify.sanitize(title),
				artists: [],
				versions: [],
				length: recording.length,
				hasVideo: recording.video !== null,
				releaseDate: DOMPurify.sanitize(recording["first-release-date"] || ""),
				score: recording.score,
			};

			recording["artist-credit"].forEach((artist: { artist: { name: any; id: any; }; }) => {
				recordingResult.artists.push({
					name: artist.artist.name,
					mbid: artist.artist.id,
				});
			});

			recording.releases.forEach((release: any) => {
				recordingResult.versions.push({
					mbid: release.id,
					title: release.title,
					artist: recordingResult.artists[0].name, // TODO: use all the artists
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
					score: 0,
				});
			});

			// Remove releases with no release date
			recordingResult.versions = recordingResult.versions.filter((version) => {
				return version.releaseDate;
			});

			for (const release in recordingResult.versions) {
				// Sort by oldest
				const releaseVer = recordingResult.versions[release];
				if (releaseVer.country == "XW" || releaseVer.country == "XE")
					recordingResult.versions[release].score += 10;
				else if (releaseVer.country == "US" || releaseVer.country == "GB")
					recordingResult.versions[release].score += 5;
				if (releaseVer.releaseDate) {
					if (releaseVer.releaseDate.includes("-"))
						recordingResult.versions[release].score += 30;
					else recordingResult.versions[release].score += 15;
				}
				if (releaseVer.secondaryType == "Compilation")
					recordingResult.versions[release].score -= 10;
				if (releaseVer.secondaryType == "Compilation")
					recordingResult.versions[release].score -= 20;
			}

			recordingResult.versions.sort((a, b) => {
				return b.score - a.score;
			});

			// @ts-expect-error
			recordingResult.versions.sort((a, b) => {
				if (!!a.releaseDate.includes("-") && !!a.releaseDate.includes("-")) {
					return (
						// Prioritize oldest
						new Date(a.releaseDate || 0).getTime() -
						new Date(b.releaseDate || 0).getTime()
					);
				}
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

		// return {
		// 	artist,
		// 	title,
		// 	versions,
		// 	hasVideo: versions.some((v) => v.hasVideo),
		// 	score: versions[0].score, // Use the highest score among versions
		// };
	}

	async SearchArtists(query: string) {
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
	}
}

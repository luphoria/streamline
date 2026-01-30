import type Webamp from "webamp";
import type { CoverArtArchiveApi, MusicBrainzApi } from "musicbrainz-api";

declare global {
	interface Window {
		mb: MusicBrainzApi;
		coverArt: CoverArtArchiveApi;
		webamp: Webamp;
	}
}

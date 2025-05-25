import type { MusicBrainz } from "./utils/MusicBrainz";

declare global {
	interface Window {
        mb: MusicBrainz;
    };
};
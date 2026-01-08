import { css, type Component } from "dreamland/core";
import { t } from "try";
import store from "../store";
import Icon from "../components/icon";
import mime from "mime";
import type { BlobTrack } from "webamp";

const Player: Component<
	{},
	{
		"on:routeshown": (path: string) => void;
	},
	{
		status: string | null;
		track: BlobTrack | null;
		url: URL;
		mbid: string;
	}
> = function () {
	this["on:routeshown"] = (path: string) =>
		(this.url = new URL(path, location.origin));

	const playSong = async (mbid: string) => {
		this.status = null;
		this.track = null;
		const response = await t(
			fetch(
				`${store.API_URL}source/track?mbid=${mbid}&sources=${store.sources}`
			)
		);
		if (!response.ok) {
			this.status = `an error occured: ${response.error}`;
			return;
		}
		if (!response.value.ok) {
			const data = await response.value.json();
			this.status = `an error occured: ${data.message}`;
			return;
		}
		const blob = await response.value.blob();

		const recordingInfo = await window.mb.lookup("recording", mbid, [
			"artist-credits",
		]);
		this.track = {
			metaData: {
				title: recordingInfo.title,
				artist: recordingInfo["artist-credit"]![0].name,
			},
			blob,
		};
		this.url.searchParams.get("query")
			? window.webamp.appendTracks([this.track])
			: window.webamp.setTracksToPlay([this.track]);
		this.status = "playing in webamp!";
	};

	const deleteCached = async (mbid: string) => {
		this.status = null;
		const response = await t(
			fetch(`${store.API_URL}source/track?mbid=${mbid}`, {
				method: "DELETE",
			})
		);

		if (!response.ok) {
			this.status = `an error occured: ${response.error}`;
			return;
		}
		if (!response.value.ok) {
			const data = await response.value.json();
			this.status = `an error occured: ${data.message}`;
			return;
		}

		this.status = "deleted item from cache";
	};
	const downloadSong = async (track: BlobTrack) => {
		const link = URL.createObjectURL(track.blob);

		const downloader = (
			<a
				style="display: none"
				href={link}
				download={`${track.metaData?.artist} - ${track.metaData?.title}.${mime.getExtension(track.blob.type)}`}
			/>
		);
		document.body.appendChild(downloader);
		downloader.click();

		URL.revokeObjectURL(link);
		downloader.remove();
	};
	use(this.mbid).listen(playSong);
	return (
		<div>
			<div>
				<input
					id="recordingMbid"
					value={use(this.mbid).map((val) => decodeURIComponent(val))}
					type="text"
				/>
				<button on:click={() => playSong(this.mbid)}>fetch song</button>
				<button on:click={() => deleteCached(this.mbid)}>
					delete from cache
				</button>
				{use(this.track).andThen(
					(track) => <button on:click={() => downloadSong(track)}>
						download song
					</button>
				)}
			</div>
			<div class="player">
				{use(this.status).andThen(
					(status) => <div>{status}</div>,
					<div class="loader">
						<Icon name="search_doc" />
					</div>
				)}
			</div>
		</div>
	);
};

Player.style = css`
	:scope {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
		justify-content: center;
		flex-direction: column;
		padding: 0.5rem;
	}

	.player {
		width: 100%;
	}
`;

export default Player;

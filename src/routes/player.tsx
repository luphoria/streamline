import { css, type Component } from "dreamland/core";
import { t } from "try";
import store from "../store";
import Icon from "../components/icon";
import mime from "mime";
import type { BlobTrack } from "webamp";

export const Player: Component<
	{},
	{},
	{
		player: HTMLElement;
		track: BlobTrack;
		queue: string;
		mbid: string;
	}
> = function () {
	const playSong = async (mbid: string) => {
		this.player = (
			<div class="loader">
				<Icon name="search_doc" />
			</div>
		);
		const response = await t(
			fetch(`/api/source/track?mbid=${mbid}&source=${store.source}`)
		);
		if (!response.ok) {
			this.player = <div>an error occured: {response.error}</div>;
			console.error(response.error);
			return;
		}
		switch (response.value.status) {
			case 200:
				this.player = <div>playing in webamp!</div>;
				break;
			case 404:
				this.player = <div>file not in cache</div>;
				return;
			case 500:
				this.player = <div>error: {response.error}</div>;
				return;
			default:
				this.player = <div>unknown error or lack of response</div>;
				return;
		}
		const blob = await response.value.blob();

		if (!window.webamp) {
			const link = URL.createObjectURL(blob);
			const player = new Audio(link);
			player.controls = true;
			player.play();
			this.player = player;
			return;
		}
		const recordingInfo = await window.mb.RecordingInfo(mbid);
		this.track = {
			metaData: {
				title: recordingInfo.title,
				artist: recordingInfo.artists[0].name,
			},
			blob,
		};
		this.queue
			? window.webamp.appendTracks([this.track])
			: window.webamp.setTracksToPlay([this.track]);
	};

	const deleteCached = async (mbid: string) => {
		this.player = <div>loading...</div>;
		const response = await t(
			fetch(`/api/source/track?mbid=${mbid}`, {
				method: "DELETE",
			})
		);

		if (!response.ok) {
			this.player = <div>an error occured: {response.error}</div>;
			console.error(response.error);
			return;
		}

		switch (response.value.status) {
			case 200:
				this.player = <div>deleted item from cache</div>;
				break;
			case 404:
				this.player = <div>file not in cache</div>;
				break;
			case 500:
				this.player = <div>error: {response.error}</div>;
				break;
			default:
				this.player = <div>unknown error or lack of response</div>;
		}
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
					value={use(this.mbid)
						.map((val) => decodeURIComponent(val))
						.bind()}
					type="text"
				/>
				<button on:click={() => playSong(this.mbid)}>fetch song</button>
				<button on:click={() => deleteCached(this.mbid)}>
					delete from cache
				</button>
				{use(this.track).andThen(
					<button on:click={() => downloadSong(this.track)}>
						download song
					</button>
				)}
			</div>
			<div class="player">{use(this.player)}</div>
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

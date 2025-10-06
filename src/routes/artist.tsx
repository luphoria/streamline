import { css, type Component } from "dreamland/core";
import Icon from "../components/icon";
import { Link } from "dreamland/router";
import type { IArtist } from "musicbrainz-api";

const Artist: Component<{
	artist: IArtist;
}> = function () {
	return (
		<div class="musicbrainz-artist">
			<h3 id="artist-name">{this.artist.name}</h3>
			<h4 id="artist-disambiguation">{this.artist.disambiguation}</h4>
			<p>
				{use(this.artist["release-groups"]).mapEach((group) => {
					return (
						<span mbid={group.id}>
							<b>
								<Link href={`/release/${group.id}`}>
									{group.title}
								</Link>{" "}
							</b>
							({group["first-release-date"]}) [{group["primary-type"]}]
							<br />
						</span>
					);
				})}
			</p>
		</div>
	);
};

export const ArtistView: Component<
	{},
	{},
	{
		artistEl: HTMLElement;
		mbid: string;
	}
> = function () {
	const updateArtist = async (mbid: string) => {
		if (!mbid) return;
		this.artistEl = (
			<div class="loader">
				<Icon name="search_doc" />
			</div>
		);
		const artist = await window.mb.lookup("artist", mbid, [
			"release-groups",
			"releases"
		]);
		this.artistEl = <Artist artist={artist} />;
	};
	use(this.mbid).listen(updateArtist);
	return (
		<div>
			<div>
				<form
					on:submit={(e: SubmitEvent) => {
						e.preventDefault();
						updateArtist(this.mbid);
					}}
				>
					<input
						value={use(this.mbid)}
						id="artistMbid"
						placeholder="e0c97a4d-c392-41a9-a374-57af3e3eeab3"
						type="text"
					/>
					<button id="artistButton" type="submit">
						view artist
					</button>
				</form>
			</div>
			<div class="artist">{use(this.artistEl)}</div>
		</div>
	);
};

ArtistView.style = css`
	:scope {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
		justify-content: center;
		flex-direction: column;
		padding: 0.5rem;
	}

	.artist {
		width: 100%;
	}
`;

export const Config = function () {
	return (
		<div class="input-row">
			<input type="text" id="musicBrainzApiUrl" placeholder="https://musicbrainz.org/ws/2/"/>
			<button id="apiUrlSetBtn">Set MusicBrainz API URL</button>
		</div>
	);
};

const YTDlpWrap = require("yt-dlp-wrap").default;

(async () => {
    const ytDlpWrap = new YTDlpWrap('yt-dlp');

let metadata = await ytDlpWrap
    .getVideoInfo([
        '--default-search',
        'ytsearch',
        `ytsearch10:"${"The Beatles - Oh! Darling"} song"`,
        '--no-playlist',
        '--no-check-certificate',
        '--flat-playlist',
        '--skip-download'
    ]);
    
    for (let res in metadata) {
        console.log(metadata[res].title);
    }
})();

const { exec } = require('child_process')
const prompt = require("prompt-sync")();

const execPromise = (input) => {
  return new Promise((resolve, reject) => {
    exec(input, (error, stdout, stderr) => {
      if (error) {
        reject(`error: ${error.message}`)
        return
      }

      if (stderr) {
        resolve(stderr)
      } else {
        resolve(stdout)
      }
    })
  })
}

const SearchAndDownload = async (query) => {
  try {
    const results = JSON.parse(await execPromise(`yt-dlp --default-search ytsearch ytsearch10:"${query} song" --no-playlist --no-check-certificate --flat-playlist --skip-download -f bestaudio --dump-single-json`)).entries;
	for (let result in results) {
		console.log(`${results[result].channel} - ${results[result].title} (${results[result].id})`);

	}
	} catch (err) {
    console.error(err)
  }
}
SearchAndDownload(prompt("Search: "));
import Lucida from "lucida";
import Tidal from "lucida/streamers/tidal/main.js";

import { tidalAccounts } from "../.env.js";

const accounts = tidalAccounts;

let userName = accounts[0].userName;
let password = accounts[0].password;
let config = accounts[0].config;

const lucida = new Lucida({
	modules: {
		tidal: new Tidal(config),
	},
	logins: {
		tidal: {
			username: userName,
			password: password,
		},
	},
});

await lucida.login();

console.info(lucida);

lucida.getByUrl("https://tidal.com/browse/track/255207223").then((track) => {
	track.getStream().then((stream) => {
		stream = stream.stream;
		// log every event
		stream.on("data", (data) => {
			// console.info(data);
		});

		stream.on("close", () => {
			console.info("stream closed");
		});
	});
});

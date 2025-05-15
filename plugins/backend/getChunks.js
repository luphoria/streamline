import https from "https";
import http from "http";
import { Readable } from "stream";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";

import Lucida from "lucida";
import Tidal from "lucida/streamers/tidal/main.js";

import { tidalAccounts } from "../../.env.js";

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

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

const convertToWav = (inputBytes) => {
  return new Promise((resolve, reject) => {
    let outputBytes = [];
    const inputStream = bufferToStream(Buffer.from(inputBytes));

    const command = ffmpeg(inputStream)
      .addOption("-compression_level 0")
      .addOption("-f wav")
      .addOption("-bitexact");

    // this prevents ffmpeg from throwing a hissy fit and i think it works so i dont care
    command.on("error", (err) => {});

    const ffstream = command.pipe();

    ffstream.on("data", (chunk) => {
      outputBytes.push(chunk);
    });

    ffstream.on("end", () => {
      const outputBuffer = Buffer.concat(outputBytes);
      // fs.writeFileSync(`./music/${Math.random()}.wav`, outputBuffer);
      resolve(outputBuffer);
    });

    ffstream.on("error", (err) => {
      console.info("Balls");
    });
  });
};

function downloadChunk(url) {
  return new Promise((resolve, reject) => {
    console.info(url);
    let downloadedBytes = 0;
    const chunks = [];

    console.log(lucida);

    let chunkIndex = 0;

    lucida
      .getByUrl("https://tidal.com/browse/track/255207223")
      .then((track) => {
        track.getStream().then((stream) => {
          stream = stream.stream;

          stream.on("data", (chunk) => {
            console.info(chunk);
            chunkIndex += 1;

            resolve({
              bytes: chunk,
              chunkIndex,
            });
          });

          stream.on("close", () => {
            console.info("stream closed");
          });

          // stream.on("error", (error) => {
          //   reject(error);
          // });
        });
        // .on("error", (error) => {
        //   reject(error);
        // });
      });
  });
}

export async function downloadAndConvert(
  url,
  chunkSizes,
  progressCallback,
  chunkCallback,
) {
  url = url.replace("https:/t", "https://t");

  console.info(url);

  const totalChunks = chunkSizes.length;
  let completedChunks = 0;
  let convertedChunks = 0;

  const downloadPromises = chunkSizes.map((size, index) =>
    downloadChunk(url, size, index)
      .then((result) => {
        completedChunks++;
        progressCallback({
          type: "download",
          progress: (completedChunks / totalChunks) * 100,
          chunkIndex: index,
        });
        return result;
      })
      .then((result) => convertToWav(result.bytes))
      .then((webmBuffer) => {
        convertedChunks++;
        progressCallback({
          type: "convert",
          progress: (convertedChunks / totalChunks) * 100,
          chunkIndex: index,
        });

        const buffer = Array.from(webmBuffer);

        chunkCallback(index, buffer);
      }),
  );

  await Promise.all(downloadPromises);
}

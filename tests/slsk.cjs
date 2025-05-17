const _ENV = import("../.env.js");
const LiveLook = require('livelook');
const fs = require('fs');

const init = async () => {
  const ENV = await _ENV; // ??????????
  console.log(ENV);

  let livelook = new LiveLook({
      username: ENV.slskAccounts[0].username,
      password: ENV.slskAccounts[0].password,
      sharedFolder: "./mp3s"
  });
  
  livelook.on('error', console.error);
  
  livelook.login((err, res) => {
      if (err || !res.success) {
          return console.log('login failed');
      }
  
      // livelook.on('sayChatroom', msg => {
      //     console.log(`[${msg.room}] <${msg.username}> ${msg.message}`);
      // });
  
      // livelook.on('messageUser', msg => {
      //     console.log(`<${msg.username}> ${msg.message}`);
      // });
  
      livelook.search('oscar jerome', (err, res) => {
          if (err) {
              return console.error(err);
          }
  
          res = res.filter(item => item.slotsFree);
  
          console.log(res);
  
          if (!res) {
              console.log('no files found :(');
              return;
          }
  
          let downloaded = fs.createWriteStream('file.mp3');
          res = res.sort((a, b) => a.speed > b.speed ? -1: 0)[0];
          livelook.downloadFile(res.username, res.file).pipe(downloaded);
      });
  });
}

init();
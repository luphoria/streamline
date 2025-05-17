const _ENV = import("../.env.js");
const LiveLook = require('livelook');
const fs = require('fs');
const sanitize = require("sanitize-filename");

const init = async () => {
  const ENV = await _ENV; // ??????????
  console.log(ENV);

  let livelook = new LiveLook({
      username: ENV.slskAccounts[0].username,
      password: ENV.slskAccounts[0].password,
      sharedFolder: "./tests/slsk-downloads", 
      waitPort: 2929
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
  
      livelook.searchFiles('oscar jerome channel your anger', (err, res) => {
          if (err) {
              return console.error(err);
          }
  
          res = res.filter(item => item.slotsFree);
  
          if (!res) {
              console.log('no files found :(');
              return;
          }
  
          res = res.sort((a, b) => a.speed > b.speed ? -1: 0)[0];
          console.log(res);
          let downloaded = fs.createWriteStream(`./tests/slsk-downloads/${sanitize(res.file)}`);
          livelook.downloadFile(res.username, res.file).pipe(downloaded);
      });
  });
}

init();
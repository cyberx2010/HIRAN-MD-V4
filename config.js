const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
  SESSION_ID: process.env.SESSION_ID || "dR4ATa7b#f-fBI5KWwIOHRasMrtRauCOiQlpDRpv872U1b7EMPy0",
  PREFIX: process.env.PREFIX || ".",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "94768698018",
  MODE: process.env.MODE || "private",
  ANTI_LINK: process.env.ANTI_LINK || "false",
  AUTO_VOICE: process.env.AUTO_VOICE || "false",
  AUTO_STICKER: process.env.AUTO_STICKER || "false",
  AUTO_REPLY: process.env.AUTO_REPLY || "false",
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
  PUBLIC_MODE: process.env.PUBLIC_MODE || "false",
  AUTO_TYPING: process.env.AUTO_TYPING || "false",
  FAKE_RECORDING: process.env.FAKE_RECORDING || "true",
  MOVIE_API_KEY: process.env.MOVIE_API_KEY || "sky|97e02fda9faf1bf4823b9ea90816a254b38969e5",

  // Added for movie downloader support
  MOVIE_JID: process.env.MOVIE_JID || "120363012345678901@g.us",  // Replace with your group ID or leave as-is
  BOT_NAME: process.env.BOT_NAME || "HIRAN MD BOT"
};

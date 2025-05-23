const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "dR4ATa7b#f-fBI5KWwIOHRasMrtRauCOiQlpDRpv872U1b7EMPy0",
PREFIX: process.env.PREFIX || ".",
// add your prifix for bot   
// automatic delete links witho remove member 
OWNER_NUMBER: process.env.OWNER_NUMBER || "94768698018",
// add your bot owner number
MODE: process.env.MODE || "private",
// make bot public-private-inbox-group 
ANTI_LINK: process.env.ANTI_LINK || "false",
// make anti link true,false for groups 
AUTO_VOICE: process.env.AUTO_VOICE || "false",
// make true for send automatic voices
AUTO_STICKER: process.env.AUTO_STICKER || "false",
// make true for automatic stickers 
AUTO_REPLY: process.env.AUTO_REPLY || "false",
// make true or false automatic text reply 
ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
// maks true for always online 
PUBLIC_MODE: process.env.PUBLIC_MODE || "false",
// make false if want private mod
AUTO_TYPING: process.env.AUTO_TYPING || "false",
// true for automatic show typing   
FAKE_RECORDING: process.env.FAKE_RECORDING || "true",
// make it true for auto recoding 
MOVIE_API_KEY: process.env.MOVIE_API_KEY || "sky|97e02fda9faf1bf4823b9ea90816a254b38969e5",
};

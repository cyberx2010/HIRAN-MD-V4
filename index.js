// index.js

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  getContentType,
  jidNormalizedUser,
  Browsers,
  downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const fs = require('fs');
const P = require('pino');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const { File } = require('megajs');
const config = require('./config');
const { sms, downloadMediaMessage } = require('./lib/msg');
const { getBuffer, getGroupAdmins, sleep } = require('./lib/functions');
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const prefix = '.';

const ownerNumber = ['94768698018'];
const autoReactEmojis = ['🫟', '💦', '🥵', '💦', '😇', '🥰', '🩵', '💗', '🩷', '💓', '💛', '💋', '🤍'];
const statusDownloadCmds = ['dapan', 'dapam', 'send', 'sv', 'save', 'one'];

let replyMap = new Map();

if (!fs.existsSync(__dirname + '/auth_info_baileys/creds.json')) {
  if (!config.SESSION_ID) return console.log('Please add your session to SESSION_ID env !!');
  const sessdata = config.SESSION_ID;
  const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
  filer.download((err, data) => {
    if (err) throw err;
    fs.writeFile(__dirname + '/auth_info_baileys/creds.json', data, () => {
      console.log("Session downloaded ✅");
    });
  });
}

async function connectToWA() {
  console.log("Connecting to WhatsApp...");
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/');
  const { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version
  });

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      console.log('Bot connected to WhatsApp ✅');

      const up = `╭━━━〔 HIRAN  MD  V4 〕━━━╮

┃ 🤖 HIRAN MD OFFICIAL
┃ Powerful MultiDevice Bot
┃
┃ Hello, ${conn.user.name || "User"}!
┃ Welcome to HIRAN MultiDevice Bot ✅
┃━━━━━━━━━━━━━━━
┃ 📢 WhatsApp Channel:
┃ https://whatsapp.com/channel/0029VbAqseT30LKNCO71mQ3d
┃ ▶️ YouTube Channel:
┃ https://youtube.com/@hiruwatech
┃ ☎️ Contact:
┃ https://wa.me/message/C3WDNO2UCH7RC1
┃━━━━━━━━━━━━━━━
┃ © Powered by Hiranya Sathsara
╰━━━━━━━━━━━━━━━━━━━╯`;

      conn.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
        image: { url: "https://files.catbox.moe/lacqi4.jpg" },
        caption: up
      });

      // Auto status seen
      conn.ev.on('messages.update', async (updates) => {
        for (const update of updates) {
          if (update.status === 'serverAck' && update.key?.remoteJid?.includes('status@broadcast')) {
            await conn.readMessages([update.key]);
            const emoji = autoReactEmojis[Math.floor(Math.random() * autoReactEmojis.length)];
            await conn.sendMessage(update.key.remoteJid, {
              react: { text: emoji, key: update.key }
            });
          }
        }
      });
    }
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0];
    if (!mek?.message) return;
    mek.message = (getContentType(mek.message) === 'ephemeralMessage')
      ? mek.message.ephemeralMessage.message
      : mek.message;

    const m = sms(conn, mek);
    const type = getContentType(mek.message);
    const from = mek.key.remoteJid;
    const sender = mek.key.fromMe ? conn.user.id : mek.key.participant || mek.key.remoteJid;
    const senderNumber = sender.split('@')[0];
    const pushname = mek.pushName || 'User';

    const body = 
      (type === 'conversation') ? mek.message.conversation :
      (mek.message?.extendedTextMessage?.contextInfo?.quotedMessage &&
        await isbtnID(mek.message?.extendedTextMessage?.contextInfo?.stanzaId) &&
        getCmdForCmdId(await getCMDStore(mek.message?.extendedTextMessage?.contextInfo?.stanzaId), mek?.message?.extendedTextMessage?.text))
      ? getCmdForCmdId(await getCMDStore(mek.message?.extendedTextMessage?.contextInfo?.stanzaId), mek?.message?.extendedTextMessage?.text)
      : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
      (type == 'imageMessage' && mek.message.imageMessage.caption) ? mek.message.imageMessage.caption :
      (type == 'videoMessage' && mek.message.videoMessage.caption) ? mek.message.videoMessage.caption : '';

    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');
    const isOwner = ownerNumber.includes(senderNumber);

    const reply = (text) => conn.sendMessage(from, { text }, { quoted: mek });

    // Auto download status media if replied with certain commands
    if (statusDownloadCmds.includes(body.toLowerCase()) && mek.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const quotedMsg = mek.message.extendedTextMessage.contextInfo.quotedMessage;
      const type = getContentType(quotedMsg);
      if (type === 'imageMessage' || type === 'videoMessage') {
        const stream = await downloadContentFromMessage(quotedMsg[type], type === 'imageMessage' ? 'image' : 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await conn.sendMessage(from, {
          [type === 'imageMessage' ? 'image' : 'video']: buffer,
          caption: `Downloaded from status by HIRAN MD.`
        }, { quoted: mek });

        await conn.sendMessage(from, {
          react: {
            text: '💗',
            key: mek.key
          }
        });
      }
    }

    // Command routing
    const events = require('./command');
    const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;

    if (isCmd) {
      const cmd = events.commands.find((cmd) => cmd.pattern === cmdName) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
      if (cmd) {
        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
        try {
          const workType = config.WORK_TYPE?.toLowerCase();
          if (workType === 'private' && !isOwner) return;
          if (workType === 'group' && !from.endsWith('@g.us')) return;
          cmd.function(conn, mek, m, { from, sender, body, command, args, q, reply });
        } catch (err) {
          console.error("[CMD ERROR]", err);
        }
      }
    }
  });
}

app.get("/", (req, res) => res.send("Bot is running ✅"));
app.listen(port, () => console.log("Server on http://localhost:" + port));

setTimeout(connectToWA, 4000);

// Make sure to also define `WORK_TYPE` in your config.js like:
// module.exports = {
//   SESSION_ID: 'your_mega_id',
//   WORK_TYPE: 'public' // or 'private' or 'group'
// };

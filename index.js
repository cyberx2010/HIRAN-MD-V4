const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const P = require('pino');
const config = require('./config');
const { sms } = require('./lib/msg');
const { getBuffer, getGroupAdmins, sleep } = require('./lib/functions');
const prefix = '.';
const ownerNumber = ['94768698018'];
let replyMap = new Map();

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

async function connectToWA() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys/');
  const { version } = await fetchLatestBaileysVersion();
  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version
  });

  // Reply Tracker
  conn.addReplyTracker = (msgId, callback) => {
    replyMap.set(msgId, { callback });
    setTimeout(() => replyMap.delete(msgId), 5 * 60 * 1000);
  };

  // Auto status view and react
  conn.ev.on('messages.upsert', async (msg) => {
    for (const m of msg.messages) {
      if (m.key?.id?.startsWith('BAE5')) {
        try {
          await sleep(20000); // 20s
          await conn.readMessages([m.key]);
          await conn.sendMessage(m.key.remoteJid, {
            react: { text: getRandomEmoji(), key: m.key }
          });
        } catch (err) {
          console.log("Auto status failed:", err);
        }
      }
    }
  });

  function getRandomEmoji() {
    const emojis = ['🔥', '❤️', '😮', '😂', '😍', '🤯', '😎', '👍', '🙌'];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
      connectToWA();
    } else if (connection === 'open') {
      const path = require('path');
      fs.readdirSync("./plugins/").forEach(file => {
        if (path.extname(file).toLowerCase() === ".js") {
          require("./plugins/" + file);
        }
      });
      console.log("Bot ready");

      const welcome = `╭━━━〔 HIRAN  MD  V4 〕━━━╮
┃ 🤖 HIRAN MD OFFICIAL
┃ 𝙋𝙤𝙬𝙚𝙧𝙛𝙪𝙡 𝙈𝙪𝙡𝙩𝙞𝙙𝙚𝙫𝙞𝙘𝙚 𝘽𝙤𝙩
┃ 👋 Hello, ${conn.user.name || 'User'}!
┃━━━━━━━━━━━━━━━
┃ 📢 https://whatsapp.com/channel/0029VbAqseT30LKNCO71mQ3d
┃ ▶️ https://youtube.com/@hiruwatech
┃ ☎️ https://wa.me/message/C3WDNO2UCH7RC1
╰━━━━━━━━━━━━━━━━━━━╯`;

      conn.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
        image: { url: "https://files.catbox.moe/lacqi4.jpg" },
        caption: welcome
      });
    }
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('messages.upsert', async (mek) => {
    mek = mek.messages[0];
    if (!mek.message) return;
    mek.message = getContentType(mek.message) === 'ephemeralMessage'
      ? mek.message.ephemeralMessage.message
      : mek.message;
    const m = sms(conn, mek);
    const type = getContentType(mek.message);
    const from = mek.key.remoteJid;
    const body = (type === 'conversation')
      ? mek.message.conversation
      : (type === 'extendedTextMessage')
        ? mek.message.extendedTextMessage.text
        : (mek.message?.imageMessage?.caption || mek.message?.videoMessage?.caption || '');

    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');
    const isGroup = from.endsWith('@g.us');
    const sender = mek.key.fromMe
      ? (conn.user.id.split(':')[0] + '@s.whatsapp.net')
      : (mek.key.participant || mek.key.remoteJid);
    const senderNumber = sender.split('@')[0];
    const botNumber = conn.user.id.split(':')[0];
    const pushname = mek.pushName || 'User';
    const isMe = botNumber.includes(senderNumber);
    const isOwner = ownerNumber.includes(senderNumber) || isMe;
    const botNumber2 = await jidNormalizedUser(conn.user.id);
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => ({})) : {};
    const participants = isGroup ? await groupMetadata.participants : [];
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : [];
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

    const reply = (teks) => conn.sendMessage(from, { text: teks }, { quoted: mek });

    // Owner reaction
    if (isOwner) {
      await conn.sendMessage(from, { react: { text: '🫟', key: mek.key } });
    }

    const stanzaId = mek.message?.extendedTextMessage?.contextInfo?.stanzaId || mek.key.id;
    if (replyMap.has(stanzaId)) {
      const { callback } = replyMap.get(stanzaId);
      return callback(m, (mek.message?.conversation || mek.message?.extendedTextMessage?.text || '').trim());
    }

    const events = require('./command');
    const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
    if (isCmd) {
      const cmd = events.commands.find((cmd) => cmd.pattern === cmdName) || events.commands.find((cmd) => cmd.alias?.includes(cmdName));
      if (cmd) {
        if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
        try {
          cmd.function(conn, mek, m, {
            from, body, isCmd, command, args, q, isGroup, sender, senderNumber,
            botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata,
            participants, groupAdmins, isBotAdmins, isAdmins, reply, replyMap
          });
        } catch (e) {
          console.error("[PLUGIN ERROR]", e);
        }
      }
    }
  });
}

app.get("/", (_, res) => res.send("Bot is online ✅"));
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
setTimeout(connectToWA, 4000);

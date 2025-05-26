const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser, getContentType, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
const fs = require('fs');
const P = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const util = require('util');
const { sms, downloadMediaMessage } = require('./lib/msg');
const axios = require('axios');
const { File } = require('megajs');
const { sendButtonMessage, listMessage, btregex } = require('./nonbutton');
const prefix = '.';

const ownerNumber = ['94768698018'];

// In-memory storage for button/list command mappings
const cmdStore = new Map();
let replyMap = new Map();

// In-memory command store functions
const updateCMDStore = async (messageId, cmdMap) => {
  cmdStore.set(messageId, cmdMap);
};

const isbtnID = async (stanzaId) => {
  return !!cmdStore.get(stanzaId);
};

const getCMDStore = async (stanzaId) => {
  return cmdStore.get(stanzaId) || [];
};

const getCmdForCmdId = async (cmdMap, cmdId) => {
  const cmd = cmdMap.find((item) => item.cmdId === cmdId);
  return cmd ? cmd.cmd : '';
};

// Placeholder for getDevice
const getDevice = (id) => 'unknown';

// Session download
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

const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

async function connectToWA() {
  console.log("Connecting wa bot 🧬...");
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/');
  var { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version
  });

  conn.addReplyTracker = (msgId, callback) => {
    replyMap.set(msgId, { callback });
    setTimeout(() => {
      replyMap.delete(msgId);
    }, 5 * 60 * 1000);
  };

  conn.updateCMDStore = updateCMDStore;
  conn.isbtnID = isbtnID;
  conn.getCMDStore = getCMDStore;
  conn.getCmdForCmdId = getCmdForCmdId;
  conn.btregex = btregex;

  conn.replyList = async (jid, list_reply, quotemek) => {
    const NON_BUTTON = true;
    if (!NON_BUTTON) {
      await conn.sendMessage(jid, list_reply, { quoted: quotemek });
    } else {
      if (!list_reply.sections) return false;
      let result = "";
      const CMD_ID_MAP = [];
      list_reply.sections.forEach((section, sectionIndex) => {
        const mainNumber = `${sectionIndex + 1}`;
        result += section.title ? `\n*${mainNumber} | ${section.title}*\n` : '';
        section.rows.forEach((row, rowIndex) => {
          const subNumber = `${mainNumber}.${rowIndex + 1}`;
          result += `*${subNumber} || ${row.title}*`;
          if (row.description) result += `\n   ${row.description}`;
          result += rowIndex === section.rows.length - 1 ? "" : "\n";
          CMD_ID_MAP.push({ cmdId: subNumber, cmd: row.rowId });
        });
        result += sectionIndex === list_reply.sections.length - 1 ? "" : "\n\n";
      });

      const listMessage = `${list_reply.title ? list_reply.title + '\n\n' : ""}${list_reply.caption || list_reply.text}\n\n${list_reply.buttonText}\n\n${result}\n\n${list_reply.footer || ''}`;
      const sentMessage = await conn.sendMessage(jid, {
        image: list_reply.image ? list_reply.image : undefined,
        caption: listMessage,
        contextInfo: {
          mentionedJid: [''],
          groupMentions: [],
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363401446603948@newsletter',
            serverMessageId: 127,
          },
          externalAdReply: {
            title: '🪄 𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 🧚‍♂️',
            body: 'ᴀ ꜱɪᴍᴘʟᴇ ᴡʜᴀᴛꜱᴀᴘᴘ ᴜꜱᴇʀ ʙᴏᴛ',
            mediaType: 1,
            sourceUrl: "https://wa.me/94768698018",
            thumbnailUrl: 'https://files.catbox.moe/4fsn8g.jpg',
            renderLargerThumbnail: false,
            showAdAttribution: true,
          },
        },
      }, { quoted: quotemek });

      await conn.updateCMDStore(sentMessage.key.id, CMD_ID_MAP);

      if (list_reply.callback) {
        conn.addReplyTracker(sentMessage.key.id, (m, responseText) => {
          list_reply.callback(m, responseText, { reply: (teks) => conn.sendMessage(jid, { text: teks }, { quoted: m }) });
        });
      }
    }
  };

  conn.replyad = async (jid, teks, quotemek) => {
    return await conn.sendMessage(jid, {
      text: teks,
      contextInfo: {
        mentionedJid: [''],
        groupMentions: [],
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363401446603948@newsletter',
          serverMessageId: 127,
        },
        externalAdReply: {
          title: '🪄 𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 🧚‍♂️',
          body: 'ᴀ ꜱɪᴍᴘʟᴇ ᴡʜᴀᴛꜱᴀᴘᴘ ᴜꜱᴇʀ ʙᴏᴛ',
          mediaType: 1,
          sourceUrl: "https://wa.me/94768698018",
          thumbnailUrl: 'https://files.catbox.moe/4fsn8g.jpg',
          renderLargerThumbnail: false,
          showAdAttribution: true,
        },
      },
    }, { quoted: quotemek });
  };

  conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    try {
      let mime = '';
      let res = await axios.head(url);
      mime = res.headers['content-type'];
      if (mime.split("/")[1] === "gif") {
        return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted });
      }
      let type = mime.split("/")[0] + "Message";
      if (mime === "application/pdf") {
        return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted });
      }
      if (mime.split("/")[0] === "image") {
        return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted });
      }
      if (mime.split("/")[0] === "video") {
        return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted });
      }
      if (mime.split("/")[0] === "audio") {
        return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted });
      }
    } catch (e) {
      console.error('Error in sendFileUrl:', e);
      return conn.sendMessage(jid, { text: '*Error: Failed to send file!*' }, { quoted });
    }
  };

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      console.log('😼 Installing... ');
      try {
        const path = require('path');
        fs.readdirSync("./plugins/").forEach((plugin) => {
          if (path.extname(plugin).toLowerCase() == ".js") {
            require("./plugins/" + plugin);
          }
        });
        console.log('Plugins installed successful ✅');
        console.log('Bot connected to whatsapp ✅');

        const up = `╭━━━〔 HIRAN  MD  V4 〕━━━╮
┃
┃ 🤖 HIRAN MD OFFICIAL
┃ 𝙋𝙤𝙬𝙚𝙧𝙛𝙪𝙡 𝙈𝙪𝙡𝙩𝙞𝙙𝙚𝙫𝙞𝙘𝙚 𝘽𝙤𝙩
┃
┃ 👋 HELLO, ${conn.user.name || "User"}!
┃ Welcome to HIRAN MultiDevice Bot ✅
┃
┃━━━━━━━━━━━━━━━
┃ 📢 WhatsApp Channel:
┃ https://whatsapp.com/channel/0029VbAqseT30LKNCO71mQ3d
┃
┃ ▶️ YouTube Channel:
┃ https://youtube.com/@hiruwatech
┃
┃ ☎️ Contact:
┃ https://wa.me/message/C3WDNO2UCH7RC1
┃
┃━━━━━━━━━━━━━━━
┃
┃ © Powered by Hiranya Sathsara
╰━━━━━━━━━━━━━━━━━━━╯`;

        conn.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
          image: { url: "https://files.catbox.moe/4fsn8g.jpg" },
          caption: up
        });
      } catch (e) {
        console.error('Error loading plugins:', e);
      }
    }
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('messages.upsert', async (mek) => {
    try {
      mek = mek.messages[0];
      if (!mek.message) return;
      mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
      const m = sms(conn, mek);
      const type = getContentType(mek.message);
      const from = mek.key.remoteJid;
      const quoted = (type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null) ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : [];
      const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : '';
      let isCmd = body.startsWith(prefix);
      let command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
      let args = body.trim().split(/ +/).slice(1);
      let q = args.join(' ');
      const isGroup = from.endsWith('@g.us');
      const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
      const senderNumber = sender.split('@')[0];
      const botNumber = conn.user.id.split(':')[0];
      const pushname = mek.pushName || 'User';
      const isMe = botNumber.includes(senderNumber);
      const isOwner = ownerNumber.includes(senderNumber) || isMe;
      const botNumber2 = await jidNormalizedUser(conn.user.id);
      const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => ({})) : '';
      const groupName = isGroup ? groupMetadata.subject : '';
      const participants = isGroup ? await groupMetadata.participants : '';
      const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
      const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
      const isAdmins = isGroup ? groupAdmins.includes(sender) : false;

      const reply = (teks) => {
        conn.sendMessage(from, { text: teks }, { quoted: mek });
      };

      if (mek.message?.extendedTextMessage?.contextInfo?.stanzaId && await conn.isbtnID(mek.message.extendedTextMessage.contextInfo.stanzaId)) {
        if (body.startsWith(prefix)) body = body.replace(prefix, '');
        if (conn.btregex(body)) {
          const cmdMap = await conn.getCMDStore(mek.message.extendedTextMessage.contextInfo.stanzaId);
          const cmd = await conn.getCmdForCmdId(cmdMap, body);
          if (cmd) {
            isCmd = true;
            command = cmd.startsWith(prefix) ? cmd.slice(prefix.length).trim().split(' ').shift().toLowerCase() : cmd;
            args = cmd.trim().split(/ +/).slice(1);
            q = args.join(' ');
          }
        }
      }

      const stanzaId = mek.message?.extendedTextMessage?.contextInfo?.stanzaId || mek.key.id;
      if (replyMap.has(stanzaId)) {
        const { callback } = replyMap.get(stanzaId);
        return callback(m, (mek.message?.conversation || mek.message?.extendedTextMessage?.text || '').trim(), { reply });
      }

      if (config.ANTI_LINK && isBotAdmins && isGroup && !isAdmins && !isOwner && body.match(`chat.whatsapp.com`)) {
        await conn.sendMessage(from, { delete: mek.key });
        await reply("Link detected and deleted!");
      }

      if (config.ANTI_BAD && isBotAdmins && isGroup && !isAdmins && !isOwner) {
        const badWords = await fetchJson("https://github.com/vihangayt0/server-/raw/main/xeonsl_bad.json").catch(e => []);
        for (let word of badWords) {
          if (body.toLowerCase().includes(word) && !body.includes('tent') && !body.includes('docu') && !body.includes('http')) {
            await conn.sendMessage(from, { delete: mek.key });
            await conn.sendMessage(from, { text: '*Bad word detected!*' });
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            break;
          }
        }
      }

      const checkBot = (id) => {
        let data = { is_bot: false, device: id.length > 21 ? 'android' : id.substring(0, 2) === '3A' ? 'ios' : 'web' };
        if (id.startsWith('BAE5')) {
          data.is_bot = true;
          data.bot_name = 'bailyes';
        }
        if (/amdi|queen|black|amda|achiya|achintha/gi.test(id)) {
          data.is_bot = true;
          data.bot_name = 'amdi';
        }
        return data;
      };

      if (config.ANTI_BOT && isBotAdmins && isGroup && !isAdmins && !isOwner) {
        const user = checkBot(mek.key.id);
        if (user.is_bot) {
          await conn.sendMessage(from, { text: `*Other bots are not allowed here!*` });
          await conn.groupParticipantsUpdate(from, [sender], 'remove');
        }
      }

      const events = require('./command');
      const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
      if (isCmd) {
        const cmd = events.commands.find((cmd) => cmd.pattern === cmdName) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
        if (cmd) {
          if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
          try {
            cmd.function(conn, mek, m, {
              from, quoted, body, isCmd, command, args, q, isGroup, sender,
              senderNumber, botNumber2, botNumber, pushname, isMe, isOwner,
              groupMetadata, groupName, participants, groupAdmins, isBotAdmins,
              isAdmins, reply, replyMap
            });
          } catch (e) {
            console.error("[PLUGIN ERROR] " + e);
          }
        }
      }

      events.commands.map(async (command) => {
        if (body && command.on === "body") {
          command.function(conn, mek, m, {
            from, quoted, body, isCmd, command, args, q, isGroup, sender,
            senderNumber, botNumber2, botNumber, pushname, isMe, isOwner,
            groupMetadata, groupName, participants, groupAdmins, isBotAdmins,
            isAdmins, reply, replyMap
          });
        }
      });

      switch (command) {
        case 'jid':
          reply(from);
          break;
        case 'device':
          reply("*User is using* _*WhatsApp unknown version*_");
          break;
        case 'ex':
          if (senderNumber === ownerNumber[0]) {
            const { exec } = require("child_process");
            exec(q, (err, stdout) => {
              if (err) return reply(`-------\n\n${err}`);
              if (stdout) return reply(`-------\n\n${stdout}`);
            });
          }
          break;
        case 'apprv':
          if (senderNumber === ownerNumber[0]) {
            let reqlist = await conn.groupRequestParticipantsList(from);
            for (let i = 0; i < reqlist.length; i++) {
              if (reqlist[i].jid.startsWith("212")) {
                await conn.groupRequestParticipantsUpdate(from, [reqlist[i].jid], "reject");
              } else {
                await conn.groupRequestParticipantsUpdate(from, [reqlist[i].jid], "approve");
              }
            }
          }
          break;
        case 'rm212':
          if (senderNumber === ownerNumber[0]) {
            for (let i = 0; i < participants.length; i++) {
              if (participants[i].id.startsWith("212")) {
                await conn.groupParticipantsUpdate(from, [participants[i].id], 'remove');
              }
            }
          }
          break;
        case 'rtf':
          console.log("rtf command triggered");
          break;
        case 'ev':
          if (senderNumber === ownerNumber[0]) {
            let code2 = q.replace("°", ".toString()");
            try {
              let resultTest = await eval(code2);
              if (typeof resultTest === "object") {
                reply(util.format(resultTest));
              } else {
                reply(util.format(resultTest));
              }
            } catch (err) {
              reply(util.format(err));
            }
          }
          break;
      }
    } catch (e) {
      console.error("[ERROR] " + e);
    }
  });
}

app.get("/", (req, res) => {
  res.send("hey, bot started✅");
});

app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

setTimeout(() => {
  connectToWA();
}, 4000);

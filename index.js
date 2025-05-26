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

// Add reply tracker method to conn later after connection

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

  // Add reply tracker method
  conn.addReplyTracker = (msgId, callback) => {
    replyMap.set(msgId, { callback });
    setTimeout(() => {
      replyMap.delete(msgId);
    }, 5 * 60 * 1000);
  };

  // Button message handler
  conn.buttonMessage = async (jid, msgData, quotemek) => {
    const NON_BUTTON = true; // Set to false to use native buttons
    if (!NON_BUTTON) {
      await conn.sendMessage(jid, msgData, { quoted: quotemek });
    } else {
      let result = "";
      const CMD_ID_MAP = [];
      msgData.buttons.forEach((button, bttnIndex) => {
        const mainNumber = `${bttnIndex + 1}`;
        result += `\n*${mainNumber} | ${button.buttonText.displayText}*\n`;
        CMD_ID_MAP.push({ cmdId: mainNumber, cmd: button.buttonId });
      });

      const buttonMessage = `${msgData.text || msgData.caption}\n🔢 Reply you want number,${result}\n\n${msgData.footer || ''}`;
      const textmsg = await conn.sendMessage(jid, {
        text: buttonMessage,
        contextInfo: {
          mentionedJid: [''],
          groupMentions: [],
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363182681793169@newsletter',
            serverMessageId: 127,
          },
          externalAdReply: {
            title: '🧚 HIRAN MD 🧚',
            body: 'ᴀ ꜱɪᴍᴘʟᴇ ᴡʜᴀᴛꜱᴀᴘᴘ ʙᴏᴛ',
            mediaType: 1,
            sourceUrl: "https://wa.me/94768698018",
            thumbnailUrl: 'https://files.catbox.moe/lacqi4.jpg',
            renderLargerThumbnail: false,
            showAdAttribution: true,
          },
        },
      }, { quoted: quotemek });
      await updateCMDStore(textmsg.key.id, CMD_ID_MAP);
    }
  };

  // List message handler
  conn.listMessage = async (jid, msgData, quotemek) => {
    const NON_BUTTON = true; // Set to false to use native lists
    if (!NON_BUTTON) {
      await conn.sendMessage(jid, msgData, { quoted: quotemek });
    } else {
      let result = "";
      const CMD_ID_MAP = [];
      msgData.sections.forEach((section, sectionIndex) => {
        const mainNumber = `${sectionIndex + 1}`;
        result += `\n*[${mainNumber}] ${section.title}*\n`;
        section.rows.forEach((row, rowIndex) => {
          const subNumber = `${mainNumber}.${rowIndex + 1}`;
          const rowHeader = `   ${subNumber} | ${row.title}`;
          result += `${rowHeader}\n`;
          if (row.description) {
            result += `   ${row.description}\n\n`;
          }
          CMD_ID_MAP.push({ cmdId: subNumber, cmd: row.rowId });
        });
      });

      const listMessage = `${msgData.text}\n\n${msgData.buttonText},${result}\n${msgData.footer || ''}`;
      const text = await conn.sendMessage(jid, {
        text: listMessage,
        contextInfo: {
          mentionedJid: [''],
          groupMentions: [],
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363182681793169@newsletter',
            serverMessageId: 127,
          },
          externalAdReply: {
            title: '🧚 HIRAN MD 🧚',
            body: 'ᴀ ꜱɪᴍᴘʟᴇ ᴡʜᴀᴛꜱᴀᴘᴘ ʙᴏᴛ',
            mediaType: 1,
            sourceUrl: "https://wa.me/94768698018",
            thumbnailUrl: 'https://files.catbox.moe/lacqi4.jpg',
            renderLargerThumbnail: false,
            showAdAttribution: true,
          },
        },
      }, { quoted: quotemek });
      await updateCMDStore(text.key.id, CMD_ID_MAP);
    }
  };

  // Reply with ad
  conn.replyad = async (teks) => {
    return await conn.sendMessage(from, {
      text: teks,
      contextInfo: {
        mentionedJid: [''],
        groupMentions: [],
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363182681793169@newsletter',
          serverMessageId: 127,
        },
        externalAdReply: {
          title: '🧚 HIRAN MD 🧚',
          body: 'ᴀ ꜱɪᴍᴘʟᴇ ᴡʜᴀᴛꜱᴀᴘᴘ ʙᴏᴛ',
          mediaType: 1,
          sourceUrl: "https://wa.me/94768698018",
          thumbnailUrl: 'https://files.catbox.moe/lacqi4.jpg',
          renderLargerThumbnail: false,
          showAdAttribution: true,
        },
      },
    }, { quoted: mek });
  };

  // File sending from URL
  conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    let mime = '';
    let res = await axios.head(url);
    mime = res.headers['content-type'];
    if (mime.split("/")[1] === "gif") {
      return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options });
    }
    let type = mime.split("/")[0] + "Message";
    if (mime === "application/pdf") {
      return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options });
    }
    if (mime.split("/")[0] === "image") {
      return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options });
    }
    if (mime.split("/")[0] === "video") {
      return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options });
    }
    if (mime.split("/")[0] === "audio") {
      return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options });
    }
  };

  conn.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
        connectToWA();
      }
    } else if (connection === 'open') {
      console.log('😼 Installing... ');
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
        image: { url: "https://files.catbox.moe/lacqi4.jpg" },
        caption: up
      });
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
      const content = JSON.stringify(mek.message);
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
      const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : '';
      const groupName = isGroup ? groupMetadata.subject : '';
      const participants = isGroup ? await groupMetadata.participants : '';
      const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
      const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
      const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
      const isReact = m.message.reactionMessage ? true : false;

      const reply = (teks) => {
        conn.sendMessage(from, { text: teks }, { quoted: mek });
      };

      // Handle button/list replies
      if (mek.message?.extendedTextMessage?.contextInfo?.stanzaId && await isbtnID(mek.message.extendedTextMessage.contextInfo.stanzaId)) {
        if (body.startsWith(prefix)) body = body.replace(prefix, '');
        const cmdMap = await getCMDStore(mek.message.extendedTextMessage.contextInfo.stanzaId);
        const cmd = await getCmdForCmdId(cmdMap, body);
        if (cmd) {
          isCmd = true;
          command = cmd.startsWith(prefix) ? cmd.slice(prefix.length).trim().split(' ').shift().toLowerCase() : cmd;
          args = cmd.trim().split(/ +/).slice(1);
          q = args.join(' ');
        }
      }

      // StanzaId reply handling
      const stanzaId = mek.message?.extendedTextMessage?.contextInfo?.stanzaId || mek.key.id;
      if (replyMap.has(stanzaId)) {
        const { callback } = replyMap.get(stanzaId);
        return callback(m, (mek.message?.conversation || mek.message?.extendedTextMessage?.text || '').trim());
      }

      // Anti-link functionality
      if (config.ANTI_LINK && isBotAdmins && isGroup && !isAdmins && !isOwner && body.match(`chat.whatsapp.com`)) {
        await conn.sendMessage(from, { delete: mek.key });
        await reply("Link detected and deleted!");
      }

      // Anti-bad word functionality
      if (config.ANTI_BAD && isBotAdmins && isGroup && !isAdmins && !isOwner) {
        const badWords = await fetchJson("https://github.com/vihangayt0/server-/raw/main/xeonsl_bad.json");
        for (let word of badWords) {
          if (body.toLowerCase().includes(word) && !body.includes('tent') && !body.includes('docu') && !body.includes('http')) {
            await conn.sendMessage(from, { delete: mek.key });
            await conn.sendMessage(from, { text: '*Bad word detected!*' });
            await conn.groupParticipantsUpdate(from, [sender], 'remove');
            break;
          }
        }
      }

      // Anti-bot detection
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

    /*  // Voice note responses
      const voiceUrl = 'https://gist.github.com/VajiraTech/32826daa4c68497b1545c7c19160d3e9/raw';
      let { data: voiceData } = await axios.get(voiceUrl);
      for (let vr in voiceData) {
        if (new RegExp(`\\b${vr}\\b`, 'gi').test(body)) {
          await conn.sendMessage(from, { audio: { url: voiceData[vr] }, mimetype: 'audio/mpeg', ptt: true }, { quoted: mek });
        }
      }*/

      // Command handling
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

      // Custom commands
      switch (command) {
        case 'jid':
          reply(from);
          break;
        case 'device': {
          const deviceq = mek.message?.extendedTextMessage?.contextInfo?.stanzaId ? getDevice(mek.message.extendedTextMessage.contextInfo.stanzaId) : 'unknown';
          reply("*User is using* _*WhatsApp " + deviceq + " version*_");
          break;
        }
        case 'ex': {
          if (senderNumber === ownerNumber[0]) {
            const { exec } = require("child_process");
            exec(q, (err, stdout) => {
              if (err) return reply(`-------\n\n${err}`);
              if (stdout) return reply(`-------\n\n${stdout}`);
            });
          }
          break;
        }
        case 'apprv': {
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
        }
        case 'rm212': {
          if (senderNumber === ownerNumber[0]) {
            for (let i = 0; i < participants.length; i++) {
              if (participants[i].id.startsWith("212")) {
                await conn.groupParticipantsUpdate(from, [participants[i].id], 'remove');
              }
            }
          }
          break;
        }
        case 'rtf': {
          console.log("rtf command triggered"); // Placeholder, as original code references undefined `dsa`
          break;
        }
        case 'ev': {
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

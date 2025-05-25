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
const NodeCache = require('node-cache'); // Added for caching
const prefix = '.';

const ownerNumber = ['94768698018'];
const replyCache = new NodeCache({ stdTTL: 300 }); // Cache for reply tracking (5 minutes)
let replyMap = new Map(); // For tracking interactive replies

// Session handling for auth
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
  const { version } = await fetchLatestBaileysVersion();

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version
  });

  // Add reply tracker method
  conn.addReplyTracker = (msgId, callback, from) => {
    const replyKey = `${from}:${msgId}`;
    replyMap.set(replyKey, { callback });
    replyCache.set(replyKey, true, 300); // Cache for 5 minutes
    setTimeout(() => {
      replyMap.delete(replyKey);
      replyCache.del(replyKey);
    }, 5 * 60 * 1000);
  };

  // Button message sender
  conn.sendButtonMessage = async (jid, buttons, text, footer, quoted = null) => {
    try {
      const buttonMessage = {
        text,
        footer,
        buttons: buttons.map((btn) => ({
          buttonId: btn.id,
          buttonText: { displayText: btn.text },
          type: 1
        })),
        headerType: 4
      };
      return await conn.sendMessage(jid, buttonMessage, { quoted });
    } catch (error) {
      console.error('Error sending button message:', error.message);
      return await conn.sendMessage(jid, { text: `Error: ${error.message}` }, { quoted });
    }
  };

  // List message sender
  conn.sendListMessage = async (jid, title, buttonText, sections, quoted = null) => {
    try {
      const listMessage = {
        text: title,
        footer: "HIRAN MD V4",
        title,
        buttonText,
        sections
      };
      return await conn.sendMessage(jid, listMessage, { quoted });
    } catch (error) {
      console.error('Error sending list message:', error.message);
      return await conn.sendMessage(jid, { text: `Error: ${error.message}` }, { quoted });
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
      const path = require('path');
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          require("./plugins/" + plugin);
        }
      });
      console.log('Plugins installed successful ✅');
      console.log('Bot connected to whatsapp ✅');

      const up = `╭━━━〔 𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 𝐕4 〕━━━╮
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

  conn.ev.on('messages.upsert', async ({ messages }) => {
    const mek = messages[0];
    if (!mek.message) return;

    // Extract message details
    const type = getContentType(mek.message);
    const content = JSON.stringify(mek.message);
    const from = mek.key.remoteJid;
    const quoted = (type === 'extendedTextMessage' && mek.message.extendedTextMessage?.contextInfo) ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : [];
    const body = (type === 'conversation') ? mek.message.conversation :
                 (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
                 (type === 'imageMessage' && mek.message.imageMessage.caption) ? mek.message.imageMessage.caption :
                 (type === 'videoMessage' && mek.message.videoMessage.caption) ? mek.message.videoMessage.caption : '';
    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');
    const isGroup = from.endsWith('@g.us');
    const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid);
    const senderNumber = sender.split('@')[0];
    const botNumber = conn.user.id.split(':')[0];
    const pushname = mek.pushName || 'User';
    const isMe = botNumber.includes(senderNumber);
    const isOwner = ownerNumber.includes(senderNumber) || isMe;
    const botNumber2 = await jidNormalizedUser(conn.user.id);
    const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(() => ({})) : {};
    const groupName = isGroup ? groupMetadata.subject || '' : '';
    const participants = isGroup ? groupMetadata.participants || [] : [];
    const groupAdmins = isGroup ? getGroupAdmins(participants) : [];
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
    const isReact = mek.message.reactionMessage ? true : false;

    // Reply function
    const reply = async (teks) => {
      try {
        await conn.sendMessage(from, { text: teks }, { quoted: mek });
      } catch (error) {
        console.error('Error in reply:', error.message);
      }
    };

    // Reaction function
    const react = async (emoji) => {
      try {
        await conn.sendMessage(from, { react: { text: emoji, key: mek.key } });
      } catch (error) {
        console.error('Error in react:', error.message);
      }
    };

    // Handle reply to list/button messages
    const stanzaId = mek.message?.extendedTextMessage?.contextInfo?.stanzaId || mek.key.id;
    const replyKey = `${from}:${stanzaId}`;
    if (replyMap.has(replyKey)) {
      const { callback } = replyMap.get(replyKey);
      try {
        await callback(mek, body.trim());
        return; // Exit after handling reply
      } catch (error) {
        console.error('Error in reply tracker callback:', error.message);
        await reply(`*Error processing your reply: ${error.message}*`);
      }
    }

    // Handle button message responses
    if (type === 'buttonsResponseMessage') {
      const buttonId = mek.message.buttonsResponseMessage.selectedButtonId;
      console.log(`Button clicked: ${buttonId} from ${from}`);
      const cmd = events.commands.find((cmd) => cmd.buttonId === buttonId);
      if (cmd) {
        try {
          await react(cmd.react || '✅');
          await cmd.function(conn, mek, m, {
            from, quoted, body, isCmd, command, args, q, isGroup, sender,
            senderNumber, botNumber2, botNumber, pushname, isMe, isOwner,
            groupMetadata, groupName, participants, groupAdmins, isBotAdmins,
            isAdmins, reply, replyMap, react
          });
        } catch (error) {
          console.error('Error in button handler:', error.message);
          await reply(`*Error: ${error.message}*`);
        }
      }
      return;
    }

    // Handle list message responses
    if (type === 'listResponseMessage') {
      const selectedRowId = mek.message.listResponseMessage.singleSelectReply.selectedRowId;
      console.log(`List item selected: ${selectedRowId} from ${from}`);
      const cmd = events.commands.find((cmd) => cmd.rowId === selectedRowId);
      if (cmd) {
        try {
          await react(cmd.react || '✅');
          await cmd.function(conn, mek, m, {
            from, quoted, body, isCmd, command, args, q, isGroup, sender,
            senderNumber, botNumber2, botNumber, pushname, isMe, isOwner,
            groupMetadata, groupName, participants, groupAdmins, isBotAdmins,
            isAdmins, reply, replyMap, react
          });
        } catch (error) {
          console.error('Error in list handler:', error.message);
          await reply(`*Error: ${error.message}*`);
        }
      }
      return;
    }

    // Handle commands
    if (isCmd) {
      const cmd = events.commands.find((cmd) => cmd.pattern === command) || 
                  events.commands.find((cmd) => cmd.alias && cmd.alias.includes(command));
      if (cmd) {
        try {
          if (cmd.react) await react(cmd.react);
          await cmd.function(conn, mek, m, {
            from, quoted, body, isCmd, command, args, q, isGroup, sender,
            senderNumber, botNumber2, botNumber, pushname, isMe, isOwner,
            groupMetadata, groupName, participants, groupAdmins, isBotAdmins,
            isAdmins, reply, replyMap, react
          });
        } catch (error) {
          console.error(`[PLUGIN ERROR] ${command}: ${error.message}`);
          await reply(`*Error in command ${command}: ${error.message}*`);
        }
      } else {
        await reply(`Command "${command}" not found.`);
      }
    }

    // Handle non-command messages
    if (!isCmd && body) {
      console.log(`Received non-command message: ${body} from ${from}`);
      // Example: Echo response for non-commands
      if (body.toLowerCase() === 'hi') {
        await reply('Hello! How can I assist you?');
      }
    }

    // Handle reactions
    if (isReact) {
      const reaction = mek.message.reactionMessage.text;
      const reactedTo = mek.message.reactionMessage.key;
      console.log(`Reaction received: ${reaction} on message ${reactedTo.id} from ${from}`);
      if (reaction === '👍') {
        await reply('Thanks for the thumbs up!');
      }
    }

    // Handle media messages
    if (type === 'imageMessage' || type === 'videoMessage') {
      const mediaType = type === 'imageMessage' ? 'Image' : 'Video';
      console.log(`Received ${mediaType} message from ${from}`);
      if (isOwner) {
        const buffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: P({ level: 'silent' }) });
        const fileName = `${mediaType}_${Date.now()}.bin`;
        fs.writeFileSync(`./media/${fileName}`, buffer);
        await reply(`${mediaType} saved as ${fileName}`);
      }
    }

    // Handle document messages
    if (type === 'documentMessage') {
      console.log(`Received document message from ${from}`);
      if (isOwner) {
        const buffer = await downloadMediaMessage(mek, 'buffer', {}, { logger: P({ level: 'silent' }) });
        const fileName = mek.message.documentMessage.fileName || `Document_${Date.now()}.bin`;
        fs.writeFileSync(`./media/${fileName}`, buffer);
        await reply(`Document saved as ${fileName}`);
      }
    }

    // Handle sticker messages
    if (type === 'stickerMessage') {
      console.log(`Received sticker message from ${from}`);
      await reply('Cool sticker! 😎');
    }

    // Handle contact messages
    if (type === 'contactMessage') {
      console.log(`Received contact message from ${from}`);
      const contact = mek.message.contactMessage.displayName || 'Unknown';
      await reply(`Received contact: ${contact}`);
    }
  });

  app.get("/", (req, res) => {
    res.send("Hey, bot started ✅");
  });

  app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));
}

setTimeout(() => {
  connectToWA();
}, 4000);

// Ensure events object is defined
const events = {
  commands: []
};

// Example plugin for testing button and list messages
events.commands.push({
  pattern: 'testbuttons',
  alias: ['buttons'],
  desc: 'Test button message',
  react: '🔘',
  function: async (conn, mek, m, { from, reply, react }) => {
    await react('🔘');
    await conn.sendButtonMessage(from, [
      { id: 'btn1', text: 'Option 1' },
      { id: 'btn2', text: 'Option 2' }
    ], 'Choose an option:', 'HIRAN MD V4', mek);
    conn.addReplyTracker(mek.key.id, async (msg, text) => {
      await reply(`You replied to button message: ${text}`);
    }, from);
  }
});

events.commands.push({
  pattern: 'testlist',
  alias: ['list'],
  desc: 'Test list message',
  react: '📜',
  function: async (conn, mek, m, { from, reply, react }) => {
    await react('📜');
    await conn.sendListMessage(from, 'Select an item:', 'Choose', [
      {
        title: 'Section 1',
        rows: [
          { title: 'Item 1', rowId: 'item1', description: 'Description for Item 1' },
          { title: 'Item 2', rowId: 'item2', description: 'Description for Item 2' }
        ]
      }
    ], mek);
    conn.addReplyTracker(mek.key.id, async (msg, text) => {
      await reply(`You selected list item: ${text}`);
    }, from);
  }
});

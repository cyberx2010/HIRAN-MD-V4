const config = require('../config');
const { cmd, commands } = require('../command');
const os = require("os");
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions');

cmd({
  pattern: "menu",
  alias: ["list"],
  desc: "Show bot menu",
  react: "📜",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { from, pushname, quoted, reply }) => {
  try {
    let menu = {
      main: '',
      download: '',
      group: '',
      owner: '',
      convert: '',
      ai: '',
      tools: '',
      search: '',
      fun: '',
      voice: '',
      other: ''
    };

    for (let i = 0; i < commands.length; i++) {
      const cmdCat = commands[i].category;
      if (commands[i].pattern && !commands[i].dontAddCommandList && menu[cmdCat] !== undefined) {
        menu[cmdCat] += `│ • .${commands[i].pattern}\n`;
      }
    }

    const text = `*╭─────────────⭓*

│  ʜɪ  ${pushname} 👋
│  ʙᴏᴛ ɪꜱ ᴏɴʟɪɴᴇ ✅
│
│  ⏱️ Uptime: ${runtime(process.uptime())}
│  💾 RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB
│
│  Choose a Menu:
│  1. Owner
│  2. Convert
│  3. AI
│  4. Search
│  5. Download
│  6. Fun
│  7. Main
│  8. Group
│  9. Other
╰─────────────⭓

Reply with the number to open the menu

> ʜɪʀᴀɴᴍᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ`;

    const sent = await conn.sendMessage(from, {
      text,
      contextInfo: {
        externalAdReply: {
          title: 'HIRAN BOT MENU',
          body: `Hi ${pushname} ✨`,
          mediaType: 1,
          sourceUrl: 'https://whatsapp.com/channel/0029Vb0Anqe9RZAcEYc2fT2c',
          thumbnailUrl: 'https://files.catbox.moe/kzemf5.jpg',
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

    conn.ev.on('messages.upsert', async (msgUpdate) => {
      const msg = msgUpdate.messages[0];
      if (!msg.message?.extendedTextMessage) return;

      const text = msg.message.extendedTextMessage.text.trim();
      if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;

      const menus = {
        '1': menu.owner,
        '2': menu.convert,
        '3': menu.ai,
        '4': menu.search,
        '5': menu.download,
        '6': menu.fun,
        '7': menu.main,
        '8': menu.group,
        '9': `${menu.other}${menu.tools}`
      };

      if (menus[text]) {
        reply(`*◈── MENU ${text} ──◈*\n\n${menus[text]}\n> ʜɪʀᴀɴᴍᴅ`);
      } else {
        reply("*❌ Invalid option. Please select 1-9.*");
      }
    });

  } catch (e) {
    console.error(e);
    reply("❌ Error showing menu.");
  }
});

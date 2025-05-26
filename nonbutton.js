const { getBuffer } = require('./lib/functions');

// Validate input (e.g., "1" or "1.1")
function btregex(dta) {
  const regex = /^[0-9]+(\.[0-9]+)?$/;
  return regex.test(dta);
}

// Send button message (text-based)
const sendButtonMessage = async (conn, jid, msgData, quotemek) => {
  let result = "";
  const CMD_ID_MAP = [];
  msgData.buttons.forEach((button, bttnIndex) => {
    const mainNumber = `${bttnIndex + 1}`;
    result += `\n*${mainNumber} | ${button.buttonText.displayText}*\n`;
    CMD_ID_MAP.push({ cmdId: mainNumber, cmd: button.buttonId });
  });

  const buttonMessage = `${msgData.text || msgData.caption}\n🔢 Reply with number${result}\n\n${msgData.footer || ''}`;
  const sentMessage = await conn.sendMessage(jid, {
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
        title: '🪄 𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 🧚',
        body: 'ᴀ ꜱɪᴍᴘʟᴇ ᴡʜᴀᴛꜱᴀᴘᴘ ʙ️ᴏᴛ',
        mediaType: 1,
        sourceUrl: "https://wa.me/94768698018",
        thumbnailUrl: 'https://files.catbox.moe/4fsn8g.jpg',
        renderLargerThumbnail: false,
        showAdAttribution: true,
      },
    },
  }, { quoted: quotemek });

  // Store command mappings
  await conn.updateCMDStore(sentMessage.key.id, CMD_ID_MAP);

  // Register callback
  if (msgData.callback) {
    conn.addReplyTracker(sentMessage.key.id, (m, responseText) => {
      msgData.callback(m, responseText, { reply: (teks) => conn.sendMessage(jid, { text: teks }, { quoted: m }) });
    });
  }
};

// Send list message (text-based)
const listMessage = async (conn, jid, msgData, quotemek) => {
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
  const sentMessage = await conn.sendMessage(jid, {
    text: listMessage,
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
        title: '🪄 𝐇𝐈𝐑𝐀𝐍 𝐌𝐃 🧚',
        body: 'ᴀ ꜱɪᴍᴘʟᴇ ᴡʜᴀᴛꜱᴀᴘᴘ ʙ️ᴏᴛ',
        mediaType: 1,
        sourceUrl: "https://wa.me/94768698018",
        thumbnailUrl: 'https://files.catbox.moe/4fsn8g.jpg',
        renderLargerThumbnail: false,
        showAdAttribution: true,
      },
    },
  }, { quoted: quotemek });

  // Store command mappings
  await conn.updateCMDStore(sentMessage.key.id, CMD_ID_MAP);

  // Register callback
  if (msgData.callback) {
    conn.addReplyTracker(sentMessage.key.id, (m, responseText) => {
      msgData.callback(m, responseText, { reply: (teks) => conn.sendMessage(jid, { text: teks }, { quoted: m }) });
    });
  }
};

module.exports = { listMessage, sendButtonMessage, btregex };

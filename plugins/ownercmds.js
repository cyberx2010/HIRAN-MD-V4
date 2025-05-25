const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const { getBuffer, downloadMediaMessage } = require('../lib/functions');
const { fromBuffer } = require('file-type');

cmd({
    pattern: "getpp",
    desc: "Fetch the profile picture of a tagged or replied user.",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { quoted, isGroup, sender, participants, reply }) => {
    try {
        // Determine the target user
        const targetJid = quoted ? quoted.sender : sender;

        if (!targetJid) return reply("⚠️ Please reply to a message to fetch the profile picture.");

        // Fetch the user's profile picture URL
        const userPicUrl = await conn.profilePictureUrl(targetJid, "image").catch(() => null);

        if (!userPicUrl) return reply("⚠️ No profile picture found for the specified user.");

        // Send the user's profile picture
        await conn.sendMessage(m.chat, {
            image: { url: userPicUrl },
            caption: "🖼️ Here is the profile picture of the specified user.\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ"
        });
    } catch (e) {
        console.error("Error fetching user profile picture:", e);
        reply("❌ An error occurred while fetching the profile picture. Please try again later.");
    
    }
});



//_______________Once View


cmd({
  pattern: "vv",
  react: '👁️',
  desc: "Convert a view-once message to a regular message",
  filename: __filename
},
async (conn, m, mek, { from, quoted, reply }) => {
  try {
    // Check if the message is a reply to another message
    if (!quoted) {
      return await reply('🚩 *Please reply to a view-once message!*');
    }

    // Check if the replied message is a view-once message
    const isViewOnce = quoted.viewOnceMessage || quoted.viewOnceMessageV2;
    if (!isViewOnce) {
      return await reply('🚩 *This is not a view-once message!*');
    }

    // Extract the actual message content (image or video)
    const msg = quoted.viewOnceMessage?.message || quoted.viewOnceMessageV2?.message;
    const type = Object.keys(msg)[0]; // e.g., imageMessage or videoMessage
    if (!['imageMessage', 'videoMessage'].includes(type)) {
      return await reply('🚩 *Only view-once images or videos are supported!*');
    }

    // Download the media
    const buffer = await downloadMediaMessage({ message: msg }, 'buffer', {}, { logger: console });
    const fileType = await fromBuffer(buffer);
    const mime = fileType?.mime || (type === 'imageMessage' ? 'image/jpeg' : 'video/mp4');

    // Prepare caption
    const caption = msg[type].caption || 'Converted from view-once message';

    // Send as regular message
    if (type === 'imageMessage') {
      await conn.sendMessage(from, {
        image: buffer,
        caption: caption,
        mimetype: mime
      }, { quoted: mek });
    } else if (type === 'videoMessage') {
      await conn.sendMessage(from, {
        video: buffer,
        caption: caption,
        mimetype: mime,
        gifPlayback: msg[type].gifPlayback || false
      }, { quoted: mek });
    }

    await reply('✅ *View-once message converted to regular message!*');
  } catch (e) {
    console.error("[VIEWONCE ERROR] ", e);
    await reply('🚩 *Error converting view-once message!*');
  }
});

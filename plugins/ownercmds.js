const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const { getBuffer, downloadMediaMessage } = require('../lib/functions');
const { fromBuffer } = require('file-type');

cmd({
    pattern: "getpp",
    desc: "Fetch the profile picture of a tagged or replied user.",
    category: "owner",
    react: "🤭",
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
            caption: "🖼️ Here is the profile picture of the ${pushName}.\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ"
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
    // Check if the message is a reply
    if (!quoted) {
      console.log('[VV] No quoted message provided');
      return await reply('🚩 *Please reply to a view-once message!*');
    }

    // Check for view-once message (supporting multiple formats)
    const isViewOnce = quoted.viewOnceMessage || quoted.viewOnceMessageV2 || quoted.viewOnceMessageV2Extension;
    if (!isViewOnce) {
      console.log('[VV] Quoted message is not a view-once message:', JSON.stringify(quoted, null, 2));
      return await reply('🚩 *This is not a view-once message!*');
    }

    // Extract the message content
    const msg = quoted.viewOnceMessage?.message ||
                quoted.viewOnceMessageV2?.message ||
                quoted.viewOnceMessageV2Extension?.message;
    if (!msg) {
      console.log('[VV] No valid message content found in view-once message');
      return await reply('🚩 *Unable to process view-once message content!*');
    }

    // Determine message type
    const type = Object.keys(msg)[0];
    if (!['imageMessage', 'videoMessage'].includes(type)) {
      console.log('[VV] Unsupported view-once message type:', type);
      return await reply('🚩 *Only view-once images or videos are supported!*');
    }

    // Download the media
    const buffer = await downloadMediaMessage({ message: msg }, 'buffer', {}, { logger: console });
    if (!buffer || buffer.length === 0) {
      console.log('[VV] Failed to download media: Empty buffer');
      return await reply('🚩 *Failed to download view-once media!*');
    }

    // Detect file type
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

    console.log('[VV] Successfully converted view-once message:', { type, mime });
    await reply('✅ *View-once message converted to regular message!*');
  } catch (e) {
    console.error('[VV ERROR]', e);
    await reply(`🚩 *Error converting view-once message:* ${e.message || 'Unknown error'}`);
  }
});

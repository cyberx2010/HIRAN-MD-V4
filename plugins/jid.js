const { cmd } = require('../command');

cmd({
  pattern: "jid",
  desc: "Get the JID, type, and name of the current chat",
  category: "owner",
  use: ".jid",
  react: "🆔",
  filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
  if (!isOwner) return reply("❌ You are not the owner!");

  let type = "Unknown";
  let name = "Unknown";

  if (from.endsWith('@s.whatsapp.net')) {
    type = "Private Chat";
    name = m.pushName || "Private Contact";
  } else if (from.endsWith('@g.us')) {
    type = "Group";
    const metadata = await conn.groupMetadata(from).catch(() => null);
    name = metadata?.subject || "Group";
  } else if (from.endsWith('@newsletter')) {
    type = "Channel";
    const metadata = await conn.channelMetadata?.(from).catch(() => null);
    name = metadata?.title || "Channel";
  }

  reply(`🆔 *Chat JID:* ${from}\n📌 *Type:* ${type}\n📛 *Name:* ${name}`);
});

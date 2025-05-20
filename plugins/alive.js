const { cmd } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');

cmd({
    pattern: "alive",
    alias: ["status", "online", "a"],
    desc: "Check bot is alive or not",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const now = new Date();

        const options = {
            timeZone: "Asia/Colombo",
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        };
        const time = now.toLocaleTimeString("en-US", options);

        const emojiMap = {
            "0": "0️⃣", "1": "1️⃣", "2": "2️⃣", "3": "3️⃣",
            "4": "4️⃣", "5": "5️⃣", "6": "6️⃣", "7": "7️⃣",
            "8": "8️⃣", "9": "9️⃣", ":": ":", "A": "🅰️",
            "P": "🅿️", "M": "Ⓜ️", " ": " "
        };
        const toEmoji = str => str.split("").map(c => emojiMap[c] || c).join("");

        const emojiTime = toEmoji(time);
        const usedRam = toEmoji((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));
        const totalRam = toEmoji((os.totalmem() / 1024 / 1024).toFixed(2));

        const hour = parseInt(now.toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: "Asia/Colombo" }));
        let greeting = "Hello!";
        if (hour >= 5 && hour < 12) greeting = "🌞 Good Morning!";
        else if (hour >= 12 && hour < 17) greeting = "☀️ Good Afternoon!";
        else if (hour >= 17 && hour < 20) greeting = "🌇 Good Evening!";
        else greeting = "🌙 Good Night!";

        const status = `
╭━━〔 *🤖 CyberX-MD-V1 STATUS* 〕━━╮

╭──〔 ${greeting} 〕──╮

🟢 *BOT STATUS:* Active & Online
👑 *Owner:* hiranya sathsara
⚙️ *Version:* 1.0.0
✏️ *Prefix:* [ ${config.PREFIX} ]
🌐 *Mode:* ${config.MODE === 'public' ? '🌍 Public' : '🔐 Private'}

⏰ *Local Time (LK):* ${emojiTime}
⏳ *Uptime:* ${runtime(process.uptime())}

💾 *RAM USAGE:*
   ├─ USED RAM: ${usedRam} MB
   └─ TOTAL RAM: ${totalRam} MB

🖥️ *Host:* ${os.hostname()}


> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ*

╰━━〔 *✨ ALIVE END ✨* 〕━━╯
`;

        // 1. Send voice message first
        await conn.sendMessage(
            from,
            {
                audio: { url: 'https://github.com/Chamijd/KHAN-DATA/raw/refs/heads/main/autovoice/cm4ozo.mp3' },
                mimetype: 'audio/mp4',
                ptt: true
            },
            { quoted: mek }
        );

        // 2. Send video (ptv mode)
        await conn.sendMessage(
            from,
            {
                video: { url: 'https://github.com/Chamijd/KHAN-DATA/raw/refs/heads/main/logo/VID-20250508-WA0031(1).mp4' },
                mimetype: 'video/mp4',
                ptv: true
            },
            { quoted: mek }
        );

        // 3. Send final status image + caption
        await conn.sendMessage(from, {
            image: { url: config.MENU_ALIVE_URL || 'https://files.catbox.moe/yo9m2r.png' },
            caption: status,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 1000,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363365603549809@newsletter',
                    newsletterName: '☈☟𝗖𝗬𝗕𝗘𝗥 𝗫 𝗠𝗗 𝗩1️⃣',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
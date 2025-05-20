const { cmd } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');

cmd({
    pattern: "alive",
    alias: ["status", "online", "a"],
    desc: "Check if the bot is alive",
    category: "main",
    react: "💦",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
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

        // Emoji map for digits & chars with cleaner style
        const emojiMap = {
            "0": "⓪", "1": "①", "2": "②", "3": "③",
            "4": "④", "5": "⑤", "6": "⑥", "7": "⑦",
            "8": "⑧", "9": "⑨", ":": "⏰", "A": "🅰️",
            "P": "🅿️", "M": "Ⓜ️", " ": " "
        };
        const toEmoji = str => str.split("").map(c => emojiMap[c] || c).join("");

        const emojiTime = toEmoji(time);
        const usedRam = toEmoji((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2));
        const totalRam = toEmoji((os.totalmem() / 1024 / 1024).toFixed(2));

        const hour = now.toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: "Asia/Colombo" });
        const hourNum = parseInt(hour);

        // Greeting based on time of day
        let greeting = "👋 Hello!";
        if (hourNum >= 5 && hourNum < 12) greeting = "🌅 Good Morning!";
        else if (hourNum >= 12 && hourNum < 17) greeting = "🌞 Good Afternoon!";
        else if (hourNum >= 17 && hourNum < 20) greeting = "🌇 Good Evening!";
        else greeting = "🌙 Good Night!";

        const status = `
╭━━━〔 *🤖 HIRAN-MD V4 STATUS* 〕━━━╮

${greeting}

🔹 *Bot Status:* 𝐁𝐨𝐭 𝐢𝐬 𝐀𝐜𝐭𝐢𝐯𝐞 𝐍𝐨𝐰 !
🔹 *Owner:* ʜɪʀᴀɴʏᴀ ꜱᴀᴛʜꜱᴀʀᴀ
🔹 *Version:* 🛠️ 4.0.1
🔹 *Prefix:* ⌨️ [ ${config.PREFIX} ]
🔹 *Mode:* ${config.MODE === 'public' ? '🌍 Public' : '🔒 Private'}

⏰ *Local Time (LK):* ${emojiTime}
⏳ *Uptime:* ${runtime(process.uptime())}

💾 *RAM Usage:*
   ├─ Used: ${usedRam} MB
   └─ Total: ${totalRam} MB

🖥️ *Host:* 🖧 ${os.hostname()}

© 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐇𝐢𝐫𝐚𝐧𝐲𝐚 𝐒𝐚𝐭𝐡𝐬𝐚𝐫𝐚
╰━━━━━━━━━━━━━━━━━━━━╯
`;

        // Send voice note
        await conn.sendMessage(from, {
            audio: { url: 'https://github.com/Chamijd/KHAN-DATA/raw/refs/heads/main/autovoice/cm4ozo.mp3' },
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: mek });

        // Send short video (ptv)
        await conn.sendMessage(from, {
            video: { url: 'https://github.com/Chamijd/KHAN-DATA/raw/refs/heads/main/logo/VID-20250508-WA0031(1).mp4' },
            mimetype: 'video/mp4',
            ptv: true
        }, { quoted: mek });

        // Send image with status caption
        await conn.sendMessage(from, {
            image: { url: config.MENU_ALIVE_URL || 'https://files.catbox.moe/kzemf5.jpg' },
            caption: status,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive command error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});